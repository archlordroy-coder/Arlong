const { app, BrowserWindow, ipcMain, BrowserView } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { initCache } = require('./services/cache.service.cjs');

// Lazy load electron-store to avoid constructor issues
let store;
const getStore = () => {
  if (!store) {
    // electron-store is ESM, need to handle it properly
    const Store = require('electron-store');
    store = new Store.default ? new Store.default() : new Store();
  }
  return store;
};

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

// --- AUTO UPDATER CONFIGURATION ---
const configureAutoUpdater = () => {
  // Configure update server URL from environment or use default
  const updateServerUrl = process.env.UPDATE_SERVER_URL || 'https://arlong-gamma.vercel.app/api/versions';

  autoUpdater.autoDownload = false; // Manual download to allow user choice
  autoUpdater.autoInstallOnAppQuit = true;

  // IPC handlers for auto-updater
  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        hasUpdate: result !== null,
        version: result?.versionInfo?.version,
        releaseDate: result?.versionInfo?.releaseDate,
        releaseNotes: result?.versionInfo?.releaseNotes
      };
    } catch (error) {
      console.error('Update check error:', error);
      return { hasUpdate: false, error: error.message };
    }
  });

  ipcMain.handle('updater:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Auto-updater event forwarding to renderer
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    mainWindow?.webContents.send('updater:error', error.message);
  });

  // Check for updates on startup (every 30 minutes)
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 30 * 60 * 1000);
  }
};

// --- IPC HANDLERS ---
ipcMain.handle('app:version', () => app.getVersion());

// Importation des handlers modulaires
require('./ipc/google.ipc.cjs');
require('./ipc/whatsapp.ipc.cjs');
require('./ipc/files.ipc.cjs');
require('./ipc/ai.ipc.cjs');

// Initialize auto-updater
configureAutoUpdater();
