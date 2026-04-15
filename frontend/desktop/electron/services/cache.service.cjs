const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const DB_PATH = path.join(app.getPath('userData'), 'arlong.db');
let db;

const initCache = () => {
  db = new Database(DB_PATH);

  const schema = `
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY, name TEXT, owner_id TEXT,
      updated_at TEXT, synced_at TEXT, is_dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY, name TEXT, parent_id TEXT, space_id TEXT,
      updated_at TEXT, synced_at TEXT, is_dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS archives (
      id TEXT PRIMARY KEY, name TEXT, folder_id TEXT,
      drive_url TEXT, local_path TEXT, mime_type TEXT,
      size INTEGER, updated_at TEXT, synced_at TEXT,
      is_dirty INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT,
      entity_type TEXT,
      entity_id TEXT,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      attempts INTEGER DEFAULT 0,
      last_error TEXT
    );
  `;

  db.exec(schema);
};

module.exports = { initCache };
