const rateLimit = require('express-rate-limit');

// Limiteur pour les tentatives de connexion (plus strict)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 tentatives par fenêtre
  message: {
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiteur pour la création de compte
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Limite chaque IP à 3 créations de compte par heure
  message: {
    message: 'Trop de comptes créés. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter };
