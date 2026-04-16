const express = require('express');
const router = express.Router();
const { analyzeImage, chatWithAssistant } = require('../services/ai.service');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    const response = await chatWithAssistant(message, history || [], context || {});
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/describe', async (req, res) => {
  try {
    const { imageBuffer, prompt } = req.body; // Buffer should be handled by multer if file upload
    const response = await analyzeImage(Buffer.from(imageBuffer, 'base64'), prompt || 'Décris cette image');
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
