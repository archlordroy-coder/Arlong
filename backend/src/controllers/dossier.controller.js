const supabase = require('../config/supabase');

const createDossier = async (req, res, next) => {
  try {
    const { name, espaceId, isPublic = false } = req.body;
    const { data: dossier, error } = await supabase
      .from('Dossier')
      .insert([{ name, espaceId, createdById: req.user.id, isPublic }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data: dossier });
  } catch (error) {
    next(error);
  }
};

const getDossiers = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('Dossier').select('*').eq('createdById', req.user.id).eq('isDeleted', false);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDossierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('Dossier').select('*').eq('id', id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateDossier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isPublic } = req.body;
    const { data, error } = await supabase.from('Dossier').update({ name, isPublic }).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteDossier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('Dossier').update({ isDeleted: true }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Dossier supprimé' });
  } catch (error) {
    next(error);
  }
};

const toggleVisibility = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isPublic } = req.body;
        const { data, error } = await supabase.from('Dossier').update({ isPublic }).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = { createDossier, getDossiers, getDossierById, updateDossier, deleteDossier, toggleVisibility };
