const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getGoogleAuthUrl, getProfile, updateProfile, deleteAccount } = require('../controllers/auth.controller');
const driveService = require('../services/googleDrive.service');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimit.middleware');
const supabase = require('../config/supabase');

const DRIVE_PLATFORMS = new Set(['web', 'desktop', 'mobile']);

// Public - Authentification classique
router.post('/register', register);
router.post('/login', login);

// Public - Authentification Google (Login/Register combiné)
router.get('/google/login-url', getGoogleAuthUrl);  // URL pour "Se connecter avec Google"
router.post('/google/callback', googleAuth);        // Callback après auth Google (login ou register auto)

// Lier le compte Google Drive (protégé)
// Étape 1 : Obtenir l'URL de consentement Google OAuth2 pour l'utilisateur actuel
router.get('/google/url', authMiddleware, (req, res) => {
  const { platform } = req.query; // web, mobile, desktop
  const normalizedPlatform = platform || 'web';

  if (!DRIVE_PLATFORMS.has(normalizedPlatform)) {
    return res.status(403).json({
      success: false,
      message: 'Google Drive est disponible uniquement sur les versions web et desktop'
    });
  }

  // On passe req.user.id et la plateforme en "state" pour s'en souvenir lors du callback
  const url = driveService.getAuthUrl(req.user.id, normalizedPlatform);
  res.json({ success: true, url });
});

// Étape 2 : Callback appelé par Google après le consentement de l'utilisateur
router.get('/google/callback', async (req, res) => {
  try {
    console.log('🔵 GET /google/callback called');
    console.log('🔵 Query params:', req.query);
    
    const { code, state } = req.query;
    if (!code || !state) {
      console.log('❌ Missing code or state');
      return res.status(400).send('Erreur: Paramètres manquants depuis Google');
    }

    // Vérifier si c'est un callback de login (state commence par auth:) ou de Drive
    if (state.startsWith('auth:')) {
      // C'est un callback de login - rediriger vers le frontend pour qu'il appelle POST /google/callback
      const platform = state.replace('auth:', '');
      console.log('🔵 Login callback detected, platform:', platform);
      
      let redirectUrl;
      if (platform === 'mobile') {
        redirectUrl = `org.mboadrive.app://login?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      } else {
        redirectUrl = `${process.env.FRONTEND_URL || 'https://arlong-gamma.vercel.app'}/login?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      }
      
      console.log('🔵 Redirecting to frontend:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    const [userId, platform] = state.split(':');
    
    if (!userId) {
      return res.status(400).send('Erreur : Session invalide (ID Utilisateur manquant)');
    }

    console.log('🔵 Drive linking callback, userId:', userId, 'platform:', platform);
    
    const tokens = await driveService.getTokensFromCode(code);
    console.log('🔵 Tokens received:', tokens ? 'Success' : 'Failed');
    
    if (tokens.refresh_token) {
      console.log('🔵 Tentative 1 : googleRefreshToken (camelCase)...');
      let { error } = await supabase.from('User').update({ googleRefreshToken: tokens.refresh_token }).eq('id', userId); 
      
      if (error && error.code === 'PGRST204') {
        console.warn('⚠️ Tentative 2 : google_refresh_token (snake_case)...');
        const res2 = await supabase.from('User').update({ google_refresh_token: tokens.refresh_token }).eq('id', userId);
        error = res2.error;
      }

      if (error && error.code === 'PGRST204') {
        console.warn('⚠️ Tentative 3 : googlerefreshtoken (minuscules)...');
        const res3 = await supabase.from('User').update({ googlerefreshtoken: tokens.refresh_token }).eq('id', userId);
        error = res3.error;
      }
      
      if (error) {
        console.warn('⚠️ ÉCHEC FINAL de sauvegarde du token (colonne manquante) :', error.message);
        // On ne bloque pas l'utilisateur, on le laisse continuer vers son dashboard
      } else {
        console.log('✅ Liaison Google Drive réussie !');
      }
    }

    // Redirection selon la plateforme
    const redirectUrl = process.env.FRONTEND_URL || 'https://arlong-gamma.vercel.app';
    const finalRedirect = platform === 'mobile' 
      ? `org.mboadrive.app://settings?drive_linked=true` 
      : `${redirectUrl}/dashboard?drive_linked=true`;
    
    res.redirect(finalRedirect);

  } catch (error) {
    console.error('❌ Erreur Callback Google:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).send('Erreur lors de la liaison du compte Google Drive. ' + error.message);
  }
});

// Protected
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteAccount);

// Alias pour le frontend (qui appelle /api/auth/profile)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
