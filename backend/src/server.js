const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const espaceRoutes = require('./routes/espace.routes');
const dossierRoutes = require('./routes/dossier.routes');
const documentRoutes = require('./routes/document.routes');
const historiqueRoutes = require('./routes/historique.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ScanVault API is running 🚀', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/espaces', espaceRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/historique', historiqueRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
  });
});

app.listen(PORT, () => {
  console.log(`✅ ScanVault Backend démarré sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
