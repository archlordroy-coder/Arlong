const { ipcMain } = require('electron');
const { getGoogleAuth } = require('../services/google/auth.service.cjs');
const { sendEmail } = require('../services/google/gmail.service.cjs');
const Store = require('electron-store');
const store = new Store();

ipcMain.handle('google:auth:status', () => {
  const tokens = store.get('google_tokens');
  return !!tokens;
});

ipcMain.handle('google:auth:disconnect', () => {
  store.delete('google_tokens');
  return true;
});

ipcMain.handle('google:gmail:send', async (_, data) => {
  return sendEmail(data);
});
