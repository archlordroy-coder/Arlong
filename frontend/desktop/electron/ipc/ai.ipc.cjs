const { ipcMain } = require('electron');
const { analyzeImage } = require('../services/ai/gemma.service.cjs');

ipcMain.handle('ai:photo:describe', async (_, archiveId) => {
  // En pratique, on devrait récupérer le buffer de l'archive ici
  // Pour l'instant, c'est un squelette
  return "Description générée par Gemma 4 pour l'archive " + archiveId;
});

ipcMain.handle('ai:chat:send', async (_, message, history, context) => {
  // Appel au service de chat IA
  return { response: "Réponse simulée de Arlong AI", action: "none" };
});
