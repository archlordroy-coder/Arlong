const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arlong', {
  // Système
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  onNetworkChange: (callback) => ipcRenderer.on('network:changed', (_, state) => callback(state)),

  // Auth & Google
  google: {
    getStatus: () => ipcRenderer.invoke('google:auth:status'),
    connect: () => ipcRenderer.invoke('google:auth:connect'),
    disconnect: () => ipcRenderer.invoke('google:auth:disconnect'),
    gmail: {
      send: (data) => ipcRenderer.invoke('google:gmail:send', data),
      listInbox: (limit) => ipcRenderer.invoke('google:gmail:inbox', limit),
    }
  },

  // Partage
  share: {
    create: (data) => ipcRenderer.invoke('share:create', data),
    listMine: () => ipcRenderer.invoke('share:mine', data),
  },

  // Fichiers & Cache
  files: {
    compress: (data) => ipcRenderer.invoke('files:compress', data),
    decompress: (data) => ipcRenderer.invoke('files:decompress', data),
    getQueueCount: () => ipcRenderer.invoke('network:queue-count'),
  },

  // WhatsApp
  whatsapp: {
    connect: () => ipcRenderer.invoke('whatsapp:connect'),
    getStatus: () => ipcRenderer.invoke('whatsapp:status'),
    getContacts: () => ipcRenderer.invoke('whatsapp:contacts'),
    sendFile: (data) => ipcRenderer.invoke('whatsapp:send-file', data),
    onQR: (callback) => ipcRenderer.on('whatsapp:qr', (_, qr) => callback(qr)),
    onReady: (callback) => ipcRenderer.on('whatsapp:ready', (_, ready) => callback(ready)),
  },

  // IA
  ai: {
    chat: (message, history, context) => ipcRenderer.invoke('ai:chat:send', message, history, context),
    photo: {
      describe: (archiveId) => ipcRenderer.invoke('ai:photo:describe', archiveId),
      ocr: (archiveId) => ipcRenderer.invoke('ai:photo:ocr', archiveId),
    }
  }
});
