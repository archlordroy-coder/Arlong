const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;

const initGemma = () => {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
  }
};

const analyzeImage = async (imageBuffer, prompt) => {
  if (!model) initGemma();
  if (!model) throw new Error('GEMINI_API_KEY is not set');

  const base64 = imageBuffer.toString('base64');
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType: 'image/jpeg' } }
  ]);
  return result.response.text();
};

module.exports = { analyzeImage };
