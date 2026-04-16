const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app, ipcMain } = require('electron');

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
  setupIpc();
};

const setupIpc = () => {
  ipcMain.handle('cache:get', (event, { table, id }) => {
    const stmt = db.prepare(\`SELECT * FROM ${table} WHERE id = ?\`);
    return stmt.get(id);
  });

  ipcMain.handle('cache:list', (event, { table, filter = {} }) => {
    let query = \`SELECT * FROM ${table}\`;
    const keys = Object.keys(filter);
    if (keys.length > 0) {
      query += ' WHERE ' + keys.map(k => \`${k} = ?\`).join(' AND ');
    }
    const stmt = db.prepare(query);
    return stmt.all(...Object.values(filter));
  });

  ipcMain.handle('cache:set', (event, { table, data }) => {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const updates = keys.map(k => \`${k} = EXCLUDED.${k}\`).join(', ');

    const stmt = db.prepare(\`
      INSERT INTO ${table} (${keys.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates}
    \`);
    return stmt.run(...Object.values(data));
  });

  ipcMain.handle('cache:delete', (event, { table, id }) => {
    const stmt = db.prepare(\`DELETE FROM ${table} WHERE id = ?\`);
    return stmt.run(id);
  });
};

module.exports = { initCache };
