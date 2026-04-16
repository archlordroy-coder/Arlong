const { ipcMain } = require('electron');
const { initWhatsApp, getClient, isReady, safeSendMessage } = require('../services/whatsapp/whatsapp.service.cjs');
const { MessageMedia } = require('wwebjs-electron');

ipcMain.handle('whatsapp:connect', async (event) => {
  const mainWindow = event.sender.getOwnerBrowserWindow();
  if (!isReady()) {
    await initWhatsApp(mainWindow);
  }
  return { status: isReady() ? 'ready' : 'connecting' };
});

ipcMain.handle('whatsapp:status', () => ({
  connected: isReady(),
  state: isReady() ? 'ready' : 'disconnected'
}));

ipcMain.handle('whatsapp:contacts', async () => {
  if (!isReady()) return [];
  const contacts = await getClient().getContacts();
  return contacts.filter(c => c.name).map(c => ({
    id: c.id._serialized,
    name: c.name,
    number: c.number
  }));
});

ipcMain.handle('whatsapp:send-file', async (_, { chatId, content, filename, mimeType, caption }) => {
  const media = new MessageMedia(mimeType, content, filename);
  const msg = await safeSendMessage(chatId, media, { caption });
  return { success: true, messageId: msg.id.id };
});
