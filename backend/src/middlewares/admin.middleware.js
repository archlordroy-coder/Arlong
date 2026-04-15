const adminEmails = ['ravel@mboa.com', 'tchinda@mboa.com', 'william@mboa.com'];

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: "Accès refusé. Droits d'administrateur requis.",
    });
  }
  next();
};

module.exports = adminMiddleware;
