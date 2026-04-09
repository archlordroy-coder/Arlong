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

    // Réponse dynamique qui force la fermeture de la fenêtre (popup ou in-app browser) et notifie l'application mère
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ARLONG Auth</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background:#0d1117; color:white; height:100vh; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; }
          button { padding:12px 24px; background:#06b6d4; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; }
        </style>
      </head>
      <body>
        <h1 style="color:#06b6d4; margin-bottom:10px;">Liaison Réussie !</h1>
        <p style="color:#a1a1aa; margin-bottom:20px;">Vous allez être redirigé vers l'application...</p>
        <button onclick="closeSafely()">Fermer cet écran</button>

        <script>
          function closeSafely() {
             if (window.opener) {
               window.opener.postMessage({ type: 'drive-linked', success: true }, '*');
             }
             window.close();
          }
          
          // Exécution immédiate
          setTimeout(closeSafely, 500);
        </script>
      </body>
      </html>
    `);
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
