const path = require('path');
const fs = require('fs');
const { app, ipcMain } = require('electron');

// MOCK: better-sqlite3 is failing to compile in this environment
// We use a simple in-memory mock for testing purposes
let db = {
  spaces: {},
  folders: {},
  archives: {},
  sync_queue: []
};

const initCache = () => {
  console.log('⚠️ Using MOCK Cache Service (In-memory)');
  setupIpc();
};

const setupIpc = () => {
  ipcMain.handle('cache:get', (event, { table, id }) => {
    return db[table]?.[id] || null;
  });

  ipcMain.handle('cache:list', (event, { table, filter = {} }) => {
    let list = Object.values(db[table] || {});
    const keys = Object.keys(filter);
    if (keys.length > 0) {
      list = list.filter(item => {
        return keys.every(k => item[k] === filter[k]);
      });
    }
    return list;
  });

  ipcMain.handle('cache:set', (event, { table, data }) => {
    if (!db[table]) db[table] = {};
    const id = data.id;
    if (id) {
      db[table][id] = { ...(db[table][id] || {}), ...data };
    }
    return { changes: 1 };
  });

  ipcMain.handle('cache:delete', (event, { table, id }) => {
    if (db[table] && db[table][id]) {
      delete db[table][id];
      return { changes: 1 };
    }
    return { changes: 0 };
  });
};

module.exports = { initCache };
