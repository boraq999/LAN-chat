import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { initDb, saveMessage, getMessages, upsertUser, getAllUsers } from "./database.ts";

const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

async function startServer() {
  const db = await initDb();
  const app = express();
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // API Routes
  app.get("/api/messages/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    const messages = await getMessages(user1, user2);
    res.json(messages);
  });

  app.get("/api/users", async (req, res) => {
    const users = await getAllUsers();
    res.json(users);
  });

  app.post("/api/upload", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(500).json({ error: err.message });
      } else if (err) {
        console.error("Unknown upload error:", err);
        return res.status(500).json({ error: "Unknown upload error" });
      }
      next();
    });
  }, (req, res) => {
    console.log("Upload request received:", req.file ? req.file.originalname : "No file");
    if (!req.file) return res.status(400).send("No file uploaded.");
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.originalname, type: req.file.mimetype });
  });

  // Socket.io Logic
  const onlineUsers = new Map<string, string>(); // socketId -> username

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", async (username: string) => {
      onlineUsers.set(socket.id, username);
      await upsertUser(username);
      
      // Broadcast updated user list
      const users = await getAllUsers();
      const onlineList = Array.from(onlineUsers.values());
      io.emit("user-status", {
        allUsers: users,
        onlineUsers: onlineList
      });
      
      console.log(`${username} joined`);
    });

    socket.on("send-msg", async (data: { sender: string; receiver: string; content: string; type?: string }) => {
      const { sender, receiver, content, type = 'text' } = data;
      await saveMessage(sender, receiver, content, type);
      
      // Emit to everyone for group chat or specifically for private (simplified for MVP: broadcast all)
      // In a real app, you'd use rooms or specific socket IDs
      io.emit("receive-msg", { ...data, timestamp: new Date().toISOString() });
    });

    socket.on("typing", (data: { sender: string; receiver: string }) => {
      socket.broadcast.emit("typing", data);
    });

    socket.on("stop-typing", (data: { sender: string; receiver: string }) => {
      socket.broadcast.emit("stop-typing", data);
    });

    socket.on("disconnect", async () => {
      const username = onlineUsers.get(socket.id);
      if (username) {
        onlineUsers.delete(socket.id);
        const users = await getAllUsers();
        const onlineList = Array.from(onlineUsers.values());
        io.emit("user-status", {
          allUsers: users,
          onlineUsers: onlineList
        });
        console.log(`${username} disconnected`);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}

startServer();
