const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables only if not already set (like on Vercel)
const fs = require('fs');
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const { initFirebase } = require('./services/firebase.service');
const { initAI } = require('./services/ai.service');
const supabase = require('./config/supabase');
const authMiddleware = require('./middlewares/auth.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
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

// Environment variables check (safe - no values exposed) (PROTECTED)
app.get('/api/env-check', authMiddleware, (req, res) => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FRONTEND_URL'
  ];

  const status = {};
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    status[varName] = value ? '✅ Set' : '❌ Missing';
  });

  const allConfigured = requiredVars.every(varName => process.env[varName]);

  res.json({
    success: allConfigured,
    message: allConfigured ? 'All environment variables configured' : 'Some variables are missing',
    variables: status,
    supabase_url: process.env.SUPABASE_URL || 'NOT SET',
    timestamp: new Date().toISOString()
  });
});

// Check actual database schema (PROTECTED)
app.get('/api/db-schema', authMiddleware, async (req, res) => {
  try {
    // Get User table columns
    const { data: userCols, error: userError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'User')
      .order('ordinal_position');

    if (userError) {
      return res.status(500).json({
        success: false,
        message: 'Cannot query schema',
        error: userError.message,
        supabase_url: process.env.SUPABASE_URL
      });
    }

    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .order('tablename');

    res.json({
      success: true,
      supabase_url: process.env.SUPABASE_URL,
      tables: tables?.map(t => t.tablename) || [],
      user_columns: userCols || [],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Schema check failed',
      error: err.message,
      supabase_url: process.env.SUPABASE_URL
    });
  }
});

// Root route - API info
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
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`✅ MboaDrive Backend démarré sur http://localhost:${PORT}`);
});

module.exports = app;
