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
