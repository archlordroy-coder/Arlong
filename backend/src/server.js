const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initFirebase } = require('./services/firebase.service');
const { initAI } = require('./services/ai.service');
const supabase = require('./config/supabase');
const authMiddleware = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/error.middleware');

// Try .env.local first (for local dev), fallback to .env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
// initFirebase(); // DÉSACTIVÉ: On utilise uniquement Google Drive pour le stockage
initAI();

const authRoutes = require('./routes/auth.routes');
const espaceRoutes = require('./routes/espace.routes');
const dossierRoutes = require('./routes/dossier.routes');
const documentRoutes = require('./routes/document.routes');
const historiqueRoutes = require('./routes/historique.routes');
const versionRoutes = require('./routes/version.routes');
const shareRoutes = require('./routes/share.routes');
const contactRoutes = require('./routes/contact.routes');
const gmailRoutes = require('./routes/gmail.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS restrictif
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://arlong-gamma.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MboaDrive API is running 🚀', timestamp: new Date().toISOString() });
});

// Database connection test (PROTECTED)
app.get('/api/db-test', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('User').select('count').limit(1);
    if (error) throw error;
    res.json({ success: true, message: 'Database connection OK', data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Test failed', error: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Mboa Drive API',
    version: '1.0.0',
    status: 'running',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/espaces', espaceRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/historique', historiqueRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ MboaDrive Backend démarré sur http://localhost:${PORT}`);
});

module.exports = app;
