const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;

const initAI = () => {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Google AI (Gemini Flash) initialized');
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
  if (!genAI) throw new Error('AI not initialized');
  const systemPrompt = `Tu es Arlong AI, l'assistant personnel intégré à Arlong System.
Tu as accès aux informations de l'utilisateur.
Espaces : ${JSON.stringify(context.spaces || [])}
Dossiers : ${JSON.stringify(context.recentFolders || [])}
Date : ${new Date().toLocaleDateString('fr-FR')}

Réponds toujours en français. Sois concis et utile.`;

  const dynamicModel = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt
  });

  // Assainir l'historique : le premier message DOIT être 'user'
  let cleanedHistory = (history || []).map(h => ({ 
    role: h.role === 'user' ? 'user' : 'model', 
    parts: [{ text: h.content || h.response || '' }] 
  }));

  if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
    cleanedHistory.shift();
  }

  const chat = dynamicModel.startChat({
    history: cleanedHistory
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
};

module.exports = { initAI, analyzeImage, chatWithAssistant };
