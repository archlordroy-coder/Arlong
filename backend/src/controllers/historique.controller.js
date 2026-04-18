const supabase = require('../config/supabase');

/**
 * Récupérer l'historique de l'utilisateur
 */
const getHistorique = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    let { data: records, error } = await supabase
      .from('Historique')
      .select('*, user:User(name)')
      .eq('userId', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Fallback 1: Missing FK relationship
    if (error && typeof error.message === 'string' && error.message.includes('relationship between')) {
      console.log('⚠️ Fallback: FK relationship missing, selecting without join');
      ({ data: records, error } = await supabase
        .from('Historique')
        .select('*')
        .eq('userId', req.user.id)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit)));
    }
    
    // Fallback 2: Missing created_at column
    if (error && typeof error.message === 'string' && error.message.includes('created_at')) {
      console.log('⚠️ Fallback: created_at column missing, selecting without order');
      ({ data: records, error } = await supabase
        .from('Historique')
        .select('*')
        .eq('userId', req.user.id)
        .limit(parseInt(limit)));
    }

    if (error) {
      console.error('❌ GetHistorique final error:', error);
      throw error;
    }

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('GetHistorique error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
  }
};

const addHistorique = async (req, res) => {
  try {
    const { actionType, docId, espaceId, details } = req.body;
    const { data, error } = await supabase
      .from('Historique')
      .insert([{
        userId: req.user.id,
        actionType,
        docId,
        espaceId,
        details: details || {}
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('AddHistorique error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout à l\'historique' });
  }
};

const deleteHistoriqueItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('Historique').delete().eq('id', id).eq('userId', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Entrée supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

const clearAllHistorique = async (req, res) => {
  try {
    const { error } = await supabase.from('Historique').delete().eq('userId', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Historique vidé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = { getHistorique, addHistorique, deleteHistoriqueItem, clearAllHistorique };
