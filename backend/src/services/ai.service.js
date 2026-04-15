const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;

const initAI = () => {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
    console.log('✅ Google AI (Gemma 4) initialized');
  }
};

const analyzeImage = async (imageBuffer, prompt) => {
  if (!model) throw new Error('AI not initialized');

  const base64 = imageBuffer.toString('base64');
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType: 'image/jpeg' } }
  ]);
  return result.response.text();
};

const chatWithAssistant = async (message, history, context) => {
  if (!model) throw new Error('AI not initialized');

  const SYSTEM_PROMPT = `Tu es Arlong AI, l'assistant personnel intégré à Arlong System.
Tu as accès aux informations suivantes de l'utilisateur :
- Espaces : ${JSON.stringify(context.spaces)}
- Dossiers récents : ${JSON.stringify(context.recentFolders)}
- Fichiers récents : ${JSON.stringify(context.recentFiles)}
- Date actuelle : ${new Date().toLocaleDateString('fr-FR')}

Tu peux effectuer des actions en répondant en JSON avec le format :
{ "response": "...", "action": "search|create|send|none", "params": {...} }

Réponds toujours en français. Sois concis et utile.`;

  const chat = model.startChat({
    history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
};

module.exports = { initAI, analyzeImage, chatWithAssistant };
