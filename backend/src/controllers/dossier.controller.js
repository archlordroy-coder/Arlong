const supabase = require('../config/supabase');

/** Créer un dossier */
const createDossier = async (req, res) => {
  try {
    const { name, isPublic, espaceId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Le nom du dossier est requis' });

    const dossierData = {
      name,
      isPublic: isPublic || false,
      createdById: req.user.id,
      ...(espaceId && { espaceId: espaceId }),
    };

    const { data: dossier, error } = await supabase
      .from('Dossier')
      .insert([dossierData])
      .select('*, createdBy:User(id, name)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: dossier });
  } catch (error) {
    console.error('Create Dossier error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
};

/** Lister les dossiers accessibles par l'utilisateur */
const getDossiers = async (req, res) => {
  try {
    const { espaceId } = req.query;

    let query = supabase
      .from('Dossier')
      .select(`
        *,
        createdBy:User(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (espaceId) {
      query = query.eq('espaceId', espaceId);
    }

    // Filtre: Possédé par l'user OU Public
    query = query.or(`createdById.eq.${req.user.id},isPublic.eq.true`);

    const { data: dossiers, error } = await query;

    if (error) throw error;

    // Supabase ne fait pas de count query automatique sur les relations dans le select simple
    // On pourrait en faire une séparée, mais pour simplifier ici on renvoie juste les dossiers.
    res.json({ success: true, data: dossiers });
  } catch (error) {
    console.error('Get Dossiers error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/** Obtenir un dossier par ID */
const getDossierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: dossier, error } = await supabase
      .from('Dossier')
      .select(`
        *,
        createdBy:User(id, name),
        documents:Document(*)
      `)
      .eq('id', id)
      .eq('documents.isDeleted', false)
      .or(`createdById.eq.${req.user.id},isPublic.eq.true`)
      .single();

    if (error || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    res.json({ success: true, data: dossier });
  } catch (error) {
    console.error('Get DossierById error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/** Modifier un dossier (nom ou visibilité) */
const updateDossier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isPublic } = req.body;

    // Vérifier si créateur
    const { data: check, error: checkError } = await supabase
      .from('Dossier')
      .select('createdById')
      .eq('id', id)
      .single();

    if (checkError || !check || check.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { data: updated, error } = await supabase
      .from('Dossier')
      .update({ 
        ...(name !== undefined && { name }), 
        ...(isPublic !== undefined && { isPublic }) 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la modification' });
  }
};

/** Supprimer un dossier et tous ses documents */
const deleteDossier = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: check, error: checkError } = await supabase
      .from('Dossier')
      .select('createdById')
      .eq('id', id)
      .single();

    if (checkError || !check || check.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Supprimer tous les documents du dossier
    await supabase
      .from('Document')
      .update({ isDeleted: true })
      .eq('dossierId', id);

    // Supprimer le dossier
    const { error } = await supabase
      .from('Dossier')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    res.json({ success: true, message: 'Dossier et fichiers supprimés' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

/** Changer la visibilité public/privé */
const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: dossier, error: checkError } = await supabase
      .from('Dossier')
      .select('createdById, isPublic')
      .eq('id', id)
      .single();

    if (checkError || !dossier || dossier.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { data: updated, error } = await supabase
      .from('Dossier')
      .update({ isPublic: !dossier.isPublic })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated, message: `Dossier rendu ${updated.isPublic ? 'public' : 'privé'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la modification' });
  }
};

module.exports = { createDossier, getDossiers, getDossierById, updateDossier, deleteDossier, toggleVisibility };
