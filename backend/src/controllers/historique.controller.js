const supabase = require('../config/supabase');

const getHistorique = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const { data, error } = await supabase
      .from('Historique')
      .select('*, user:User(name), document:Document(name)')
      .eq('userId', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteHistoriqueItem = async (req, res, next) => {
  try {
    await supabase.from('Historique').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Item supprimé' });
  } catch (error) {
    next(error);
  }
};

const clearAllHistorique = async (req, res, next) => {
  try {
    await supabase.from('Historique').delete().eq('userId', req.user.id);
    res.json({ success: true, message: 'Historique vidé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistorique, deleteHistoriqueItem, clearAllHistorique };
