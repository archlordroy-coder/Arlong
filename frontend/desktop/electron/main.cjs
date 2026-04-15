const { app, BrowserWindow, ipcMain, BrowserView } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const { initCache } = require('./services/cache.service.cjs');

// Initialisation du store pour les préférences locales
const store = new Store();

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Mboa Drive - Desktop v2.0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  initCache();
  createWindow();

  // Vérification des mises à jour
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
  initCache();
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC HANDLERS ---
ipcMain.handle('app:version', () => app.getVersion());

// Importation des handlers modulaires (A implémenter dans les étapes suivantes)
require('./ipc/google.ipc.cjs');
require('./ipc/whatsapp.ipc.cjs');
require('./ipc/files.ipc.cjs');
require('./ipc/ai.ipc.cjs');
