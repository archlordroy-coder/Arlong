const supabase = require('../config/supabase');

/** Obtenir l'historique (filtré par document ou utilisateur) */
const getHistorique = async (req, res) => {
  try {
    const { docId, userId, action, page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from('Historique')
      .select(`
        *,
        user:User(id, name, email, avatar),
        doc:Document(id, name, type, isDeleted, dossier:Dossier(id, name, createdById, isPublic))
      `, { count: 'exact' });

    if (docId) query = query.eq('docId', parseInt(docId));
    if (userId) query = query.eq('userId', userId);
    if (action) query = query.eq('actionType', action);

    const { data: historiques, error, count } = await query
      .order('actionDate', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Filtrage pour la sécurité: On ne voit que les historiques des docs auxquels on a accès
    const filteredHist = historiques.filter(h => {
        if (!h.doc) return false;
        if (h.doc.isDeleted) return false;
        const d = h.doc.dossier;
        return d.createdById === req.user.id || d.isPublic === true;
    });

    res.json({
      success: true,
      data: filteredHist,
      meta: { 
        total: count, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        pages: Math.ceil(count / parseInt(limit)) 
      },
    });
  } catch (error) {
    console.error('Get Historique error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getHistorique };
