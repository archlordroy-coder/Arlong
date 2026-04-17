const supabase = require('../config/supabase');

/**
 * Récupérer l'historique de l'utilisateur
 * Note: On évite les jointures complexes si les relations Supabase sont mal détectées
 */
const getHistorique = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // 1. Récupérer l'historique
    const { data: records, error } = await supabase
      .from('Historique')
      .select('*')
      .eq('userId', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // 2. Enrichir manuellement (Workaround pour relations manquantes)
    const enrichedData = await Promise.all(records.map(async (record) => {
      let userName = 'Utilisateur';
      let docName = 'Document';

      // On pourrait optimiser avec des IN queries, mais ici on fait simple pour déboguer
      if (record.userId) {
        const { data: u } = await supabase.from('User').select('name').eq('id', record.userId).single();
        if (u) userName = u.name;
      }
      
      if (record.docId) {
        const { data: d } = await supabase.from('Document').select('name').eq('id', record.docId).single();
        if (d) docName = d.name;
      }

      return {
        ...record,
        user: { name: userName },
        document: { name: docName }
      };
    }));

    res.json({ success: true, data: enrichedData });
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
        details: details || {},
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
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
