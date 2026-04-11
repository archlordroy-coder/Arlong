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
        document:Document(id, name, type, isDeleted, dossier:Dossier(id, name, createdById, isPublic, espace:Espace(id, name)))
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
        if (!h.document) return false;
        if (h.document.isDeleted) return false;
        const d = h.document.dossier;
        return d.createdById === req.user.id || d.isPublic === true;
    }).map(h => ({
      ...h,
      created_at: h.actionDate
    }));

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

/** Supprimer une entrée d'historique */
const deleteHistoriqueItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Historique')
      .delete()
      .eq('id', parseInt(id))
      .eq('userId', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Entrée supprimée' });
  } catch (error) {
    console.error('Delete Historique error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

/** Supprimer tout l'historique de l'utilisateur */
const clearAllHistorique = async (req, res) => {
  try {
    const { error } = await supabase
      .from('Historique')
      .delete()
      .eq('userId', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Historique effacé' });
  } catch (error) {
    console.error('Clear Historique error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = { getHistorique, deleteHistoriqueItem, clearAllHistorique };
