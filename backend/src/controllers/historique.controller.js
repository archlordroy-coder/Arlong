const supabase = require('../config/supabase');

/** Obtenir l'historique (filtré par document ou utilisateur) */
const getHistorique = async (req, res) => {
  try {
    const { docId, userId, action, page = 1, limit = 20 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    console.log('🔵 GetHistorique called by user:', req.user.id);

    // Vérifier d'abord si la table Historique existe
    const { error: tableCheckError } = await supabase
      .from('Historique')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('❌ Historique table error:', tableCheckError);
      return res.json({ 
        success: true, 
        data: [], 
        meta: { total: 0, page: 1, limit: parseInt(limit), pages: 0 },
        message: 'Historique non disponible' 
      });
    }

    // Requête simplifiée sans jointures complexes pour éviter les erreurs
    let query = supabase
      .from('Historique')
      .select('*', { count: 'exact' });

    // Par défaut, on filtre par l'utilisateur connecté
    query = query.eq('userId', req.user.id);
    
    if (docId) query = query.eq('docId', docId);
    if (action) query = query.eq('actionType', action);

    const { data: historiques, error, count } = await query
      .order('actionDate', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    // Enrichir les données avec les infos utilisateur et document si disponibles
    const enrichedHist = historiques.map(h => ({
      ...h,
      created_at: h.actionDate,
      user: { id: h.userId },
      document: h.docId ? { id: h.docId } : null
    }));

    res.json({
      success: true,
      data: enrichedHist,
      meta: { 
        total: count, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        pages: Math.ceil(count / parseInt(limit)) 
      },
    });
  } catch (error) {
    console.error('❌ Get Historique error:', error);
    console.error('❌ Error details:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur: ' + (error.message || 'Unknown error'),
      error: error.message 
    });
  }
};

/** Supprimer une entrée d'historique */
const deleteHistoriqueItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Historique')
      .delete()
      .eq('id', id)
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
