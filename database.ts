import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database;

export async function initDb() {
  db = await open({
    filename: path.join(process.cwd(), 'chat.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
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
  return await db.run(
    'INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)',
    [sender, receiver, content, type]
  );
}

export async function getMessages(user1: string, user2: string) {
  // Simple private chat query: messages between two users or group messages (if receiver is 'all')
  if (user2 === 'all') {
    return await db.all(
      'SELECT * FROM messages WHERE receiver = "all" ORDER BY timestamp ASC'
    );
  }
  return await db.all(
    'SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp ASC',
    [user1, user2, user2, user1]
  );
}

export async function upsertUser(username: string) {
  return await db.run(
    'INSERT INTO users (username, last_seen) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(username) DO UPDATE SET last_seen = CURRENT_TIMESTAMP',
    [username]
  );
}

export async function getAllUsers() {
  return await db.all('SELECT * FROM users ORDER BY last_seen DESC');
}
