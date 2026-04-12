const supabase = require('../config/supabase');

/** Créer un espace de travail */
const createEspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Le nom de l\'espace est requis' });

    const { data: espace, error } = await supabase
      .from('Espace')
      .insert([{ name, createdById: req.user.id }])
      .select('*, createdBy:User!createdById(id, name, email)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: espace });
  } catch (error) {
    console.error('Create Espace error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
};

/** Lister les espaces de l'utilisateur */
const getEspaces = async (req, res) => {
  try {
    const { data: espaces, error } = await supabase
      .from('Espace')
      .select(`
        *,
        createdBy:User!createdById(id, name, email),
        users:EspaceUser(
          user:User(id, name, email, avatar)
        )
      `)
      .eq('isDeleted', false)
      .or(`createdById.eq.${req.user.id}`)

    if (error) throw error;

    res.json({ success: true, data: espaces || [] });
  } catch (error) {
    console.error('Get Espaces error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
const getEspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: espace, error } = await supabase
      .from('Espace')
      .select(`
        *,
        createdBy:User!createdById(id, name, email),
        users:EspaceUser(
          user:User(id, name, email, avatar)
        ),
        dossiers:Dossier(*)
      `)
      .eq('id', parseInt(id))
      .eq('isDeleted', false)
      .single();

    if (error || !espace) {
      return res.status(404).json({ success: false, message: 'Espace non trouvé' });
    }

    // Vérifier l'accès
    const isCreator = espace.createdById === req.user.id;
    const isMember = espace.users && espace.users.some(u => u.user.id === req.user.id);

    if (!isCreator && !isMember) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    res.json({ success: true, data: espace });
  } catch (error) {
    console.error('Get EspaceById error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/** Modifier un espace */
const updateEspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Vérifier si créateur
    const { data: check, error: checkError } = await supabase
      .from('Espace')
      .select('createdById')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !check || check.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { data: updated, error } = await supabase
      .from('Espace')
      .update({ name })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la modification' });
  }
};

/** Supprimer un espace (soft delete) */
const deleteEspace = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: check, error: checkError } = await supabase
      .from('Espace')
      .select('createdById')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !check || check.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { error } = await supabase
      .from('Espace')
      .update({ isDeleted: true })
      .eq('id', parseInt(id));

    if (error) throw error;

    res.json({ success: true, message: 'Espace supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

/** Inviter un utilisateur dans un espace */
const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const { data: espace, error: checkError } = await supabase
      .from('Espace')
      .select('createdById')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !espace || espace.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { data: userToInvite, error: findError } = await supabase
      .from('User')
      .select('id, name')
      .eq('email', email)
      .single();

    if (findError || !userToInvite) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const { error: inviteError } = await supabase
      .from('EspaceUser')
      .upsert({ userId: userToInvite.id, espaceId: parseInt(id) });

    if (inviteError) throw inviteError;

    res.json({ success: true, message: `${userToInvite.name} a été invité dans l'espace` });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'invitation' });
  }
};

/** Obtenir les statistiques globales de l'utilisateur */
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get espaces where user has access (created or invited)
    const { data: myEspaces } = await supabase
      .from('Espace')
      .select('id')
      .eq('createdById', userId)
      .eq('isDeleted', false);

    const { data: invitedEspaces } = await supabase
      .from('EspaceUser')
      .select('espaceId')
      .eq('userId', userId);

    const allEspaceIds = [
      ...(myEspaces?.map(e => e.id) || []),
      ...(invitedEspaces?.map(e => e.espaceId) || [])
    ];
    const uniqueEspaceIds = [...new Set(allEspaceIds)];

    const espacesCount = uniqueEspaceIds.length;

    // Get ALL dossiers (created by user OR public) - just select the data
    const { data: allDossiers } = await supabase
      .from('Dossier')
      .select('id')
      .or(`createdById.eq.${userId},isPublic.eq.true`);

    const allDossierIds = allDossiers?.map(d => d.id) || [];
    const dossiersCount = allDossierIds.length;

    // Get documents for those dossiers
    let documentsCount = 0;
    if (allDossierIds.length > 0) {
      const { data: documents } = await supabase
        .from('Document')
        .select('id')
        .eq('isDeleted', false)
        .in('dossierId', allDossierIds);
      
      documentsCount = documents?.length || 0;
    }

    res.json({
      success: true,
      data: {
        espaces: espacesCount,
        dossiers: dossiersCount,
        documents: documentsCount
      }
    });
  } catch (error) {
    console.error('Get Stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des stats' });
  }
};

module.exports = { createEspace, getEspaces, getEspaceById, updateEspace, deleteEspace, inviteUser, getStats };
