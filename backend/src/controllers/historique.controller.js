const supabase = require('../config/supabase');

/**
 * Récupérer l'historique de l'utilisateur
 * Note: On évite les jointures complexes si les relations Supabase sont mal détectées
 */
const getHistorique = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // 1. Récupérer l'historique
    let query = supabase
      .from('Historique')
      .select('*')
      .eq('userId', req.user.id);

    // Tentative de tri avec fallback si la colonne manque au cache
    const { data: testData, error: testError } = await query.order('created_at', { ascending: false }).limit(parseInt(limit));
    
    let records;
    if (testError && testError.code === '42703') {
      console.warn('⚠️ Colonne created_at non trouvée dans le cache pour Historique, chargement sans tri.');
      const { data, error } = await query.limit(parseInt(limit));
      if (error) throw error;
      records = data;
    } else if (testError) {
      throw testError;
    } else {
      records = testData;
    }

    // 2. Enrichir manuellement (Workaround pour relations manquantes)
    const enrichedData = await Promise.all(records.map(async (record) => {
      let userName = 'Utilisateur';
      let docName = 'Document';

      // On pourrait optimiser avec des IN queries, mais ici on fait simple pour déboguer
      if (record.userId) {
        const { data: u } = await supabase.from('User').select('name').eq('id', record.userId).single();
        if (u) userName = u.name;
      }
      
      // Note: On ne cherche pas de document car la colonne docId n'existe pas dans Historique selon votre schéma
      return {
        ...record,
        user: { name: userName }
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
        action: actionType, // On mappe actionType vers action
        espaceId,
        details: details || {}
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
