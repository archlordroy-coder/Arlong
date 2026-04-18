const supabase = require('../config/supabase');

const createEspace = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { data: espace, error } = await supabase
      .from('Espace')
      .insert([{ name, createdById: req.user.id }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data: espace });
  } catch (error) {
    next(error);
  }
};

const getEspaces = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('Espace')
      .select('*')
      .eq('createdById', req.user.id)
      .eq('isDeleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getEspaceById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('Espace').select('*').eq('id', id).single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
};

const updateEspace = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const { data, error } = await supabase.from('Espace').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
};

const deleteEspace = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('Espace').update({ isDeleted: true }).eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Espace supprimé' });
    } catch (error) {
      next(error);
    }
};

const inviteUser = async (req, res, next) => {
    try {
      res.status(501).json({ success: false, message: 'Non implémenté' });
    } catch (error) {
      next(error);
    }
};

const getStats = async (req, res, next) => {
  try {
    const { count: espaces } = await supabase.from('Espace').select('*', { count: 'exact', head: true }).eq('createdById', req.user.id);
    const { count: documents } = await supabase.from('Document').select('*', { count: 'exact', head: true }).eq('createdById', req.user.id);
    res.json({ success: true, data: { espaces: espaces || 0, documents: documents || 0 } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEspace, getEspaces, getEspaceById, updateEspace, deleteEspace, inviteUser, getStats };
