const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, deleteAccount } = require('../controllers/auth.controller');
const driveService = require('../services/googleDrive.service');
const authMiddleware = require('../middlewares/auth.middleware');
const supabase = require('../config/supabase');

// Public
router.post('/register', register);
router.post('/login', login);

// Lier le compte Google Drive (protégé)
// Étape 1 : Obtenir l'URL de consentement Google OAuth2 pour l'utilisateur actuel
router.get('/google/url', authMiddleware, (req, res) => {
  const { platform } = req.query; // web, mobile, desktop
  // On passe req.user.id et la plateforme en "state" pour s'en souvenir lors du callback
  const url = driveService.getAuthUrl(req.user.id, platform || 'web');
  res.json({ success: true, url });
});

// Étape 2 : Callback appelé par Google après le consentement de l'utilisateur
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send('Erreur: Paramètres manquants depuis Google');
    }

    const [userId, platform] = state.split(':');
    
    if (!userId) {
      return res.status(400).send('Erreur : Session invalide (ID Utilisateur manquant)');
    }

    const tokens = await driveService.getTokensFromCode(code);
    
    if (tokens.refresh_token) {
      // Sauvegarder le refresh_token dans la base pour stocker SUR SON DRIVE
      const { error } = await supabase
        .from('User')
        .update({ google_refresh_token: tokens.refresh_token })
        .eq('id', userId); 
      
      if (error) throw error;
    }

    // Redirection selon la plateforme
    if (platform === 'mobile') {
      res.redirect('mboadrive://app/drive-success');
    } else {
      // Pour le Web/Desktop, retourner vers le frontend classique (remplacer par VERCEL_URL si besoin en prod)
      const redirectUrl = process.env.FRONTEND_URL || 'https://arlong-gamma.vercel.app';
      res.redirect(`${redirectUrl}/dashboard?drive_linked=true`);
    }

  } catch (error) {
    console.error('Erreur Callback Google:', error.message);
    res.status(500).send('Erreur lors de la liaison du compte Google Drive. ' + error.message);
  }
});

// Protected
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteAccount);

module.exports = router;
