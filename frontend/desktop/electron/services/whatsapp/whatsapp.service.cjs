const { app, BrowserView } = require('electron');
const { Client, LocalAuth } = require('wwebjs-electron');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const path = require('path');

let waClient = null;
let waReady = false;

const initWhatsApp = async (mainWindow) => {
  try {
    await pie.initialize(app);
    const browser = await pie.connect(app, puppeteer);

    const waView = new BrowserView({
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    const page = await pie.getPage(browser, waView);
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    waClient = new Client({
      puppeteer: {
        browserWSEndpoint: browser.wsEndpoint(),
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      authStrategy: new LocalAuth({
        dataPath: path.join(app.getPath('userData'), 'whatsapp-session')
      }),
    });

    waClient.on('qr', (qr) => {
      mainWindow.webContents.send('whatsapp:qr', qr);
    });

    waClient.on('ready', () => {
      waReady = true;
      mainWindow.webContents.send('whatsapp:ready', true);
    });

    waClient.on('disconnected', () => {
      waReady = false;
      mainWindow.webContents.send('whatsapp:disconnected', true);
    });

    await waClient.initialize();
  } catch (error) {
    console.error('WhatsApp init error:', error);
  }
};

const getClient = () => waClient;
const isReady = () => waReady;

/**
 * Envoi sécurisé avec délai anti-ban
 */
const safeSendMessage = async (chatId, content, options = {}) => {
  if (!waClient || !waReady) throw new Error('WhatsApp not ready');

  // Délai aléatoire entre 2 et 5 secondes pour simuler un comportement humain
  const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  return waClient.sendMessage(chatId, content, options);
};

module.exports = { initWhatsApp, getClient, isReady, safeSendMessage };
