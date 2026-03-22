import Database from 'better-sqlite3';
import path from 'path';

let db: any;

export async function initDb() {
  db = new Database(path.join(process.cwd(), 'chat.db'));

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      receiver TEXT,
      content TEXT,
      type TEXT DEFAULT 'text',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export async function saveMessage(sender: string, receiver: string, content: string, type: string = 'text') {
  const stmt = db.prepare('INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)');
  return stmt.run(sender, receiver, content, type);
}

export async function getMessages(user1: string, user2: string) {
  if (user2 === 'all') {
    const stmt = db.prepare("SELECT * FROM messages WHERE receiver = 'all' ORDER BY timestamp ASC");
    return stmt.all();
  }
  const stmt = db.prepare('SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp ASC');
  return stmt.all(user1, user2, user2, user1);
}

export async function upsertUser(username: string) {
  const stmt = db.prepare('INSERT INTO users (username, last_seen) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(username) DO UPDATE SET last_seen = CURRENT_TIMESTAMP');
  return stmt.run(username);
}

export async function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY last_seen DESC');
  return stmt.all();
}
