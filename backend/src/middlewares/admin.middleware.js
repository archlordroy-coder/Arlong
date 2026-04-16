const supabase = require('../config/supabase');

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 */
const adminMiddleware = async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(403).json({
      success: false,
      message: "Accès refusé. Droits d'administrateur requis.",
    });
  }

  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Droits d'administrateur requis.",
      });
    }

    req.user.is_admin = true;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des droits administrateur.",
    });
  }
};

module.exports = adminMiddleware;
