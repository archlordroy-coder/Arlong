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

    // Réponse adaptée selon la plateforme
    if (platform === 'mobile') {
      // Pour le mobile, on peut rediriger vers une page de succès simple ou un deep link
      return res.send(`
        <div style="background:#0d1117; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
          <h1 style="color:#4285F4">ARLONG MOBILE</h1>
          <p>Liaison Google Drive réussie !</p>
          <button onclick="window.close()" style="padding:10px 20px; background:#4285F4; border:none; color:white; border-radius:5px;">Retour à l'application</button>
          <script>
            // Optionnel : Tentative de redirection automatique vers l'app mobile si configurée
            // window.location.href = 'arlong://auth-success';
          </script>
        </div>
      `);
    }

    // Comportement par défaut (Web / Desktop)
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'drive-linked', success: true }, '*');
        }
        alert('Compte Google Drive lié avec succès !');
        window.close();
      </script>
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
