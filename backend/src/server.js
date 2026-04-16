const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initFirebase } = require('./services/firebase.service');
const { initAI } = require('./services/ai.service');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MboaDrive API is running 🚀', timestamp: new Date().toISOString() });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('🔵 Testing database connection...');
    console.log('🔵 SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'NOT SET');
    console.log('🔵 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'NOT SET');

    const { data, error } = await supabase.from('User').select('count').limit(1);

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message,
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      });
    }

    res.json({
      success: true,
      message: 'Database connection OK',
      data: data,
      supabase_configured: true
    });
  } catch (err) {
    console.error('❌ Test error:', err);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: err.message
    });
  }
});

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Mboa Drive API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register'
    },
    message: 'API is running. Use /api/health for health check.'
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
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
  });
});

app.listen(PORT, () => {
  console.log(`✅ MboaDrive Backend démarré sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
