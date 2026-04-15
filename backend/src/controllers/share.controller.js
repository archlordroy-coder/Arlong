const supabase = require('../config/supabase');

/**
 * Créer un partage (Dossier ou Espace)
 */
const createShare = async (req, res) => {
  try {
    const { resourceId, resourceType, email, permission } = req.body;

    if (!resourceId || !resourceType || !email || !permission) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }

    // 1. Vérifier si l'utilisateur cible existe
    const { data: targetUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // 2. Vérifier si l'appelant est le propriétaire (ou a les droits admin sur la ressource)
    const table = resourceType === 'folder' ? 'Dossier' : 'Espace';
    const { data: resource, error: resError } = await supabase
      .from(table)
      .select('createdById')
      .eq('id', resourceId)
      .single();

    if (resError || !resource) {
      return res.status(404).json({ success: false, message: 'Ressource non trouvée' });
    }

    if (resource.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: "Vous n'êtes pas le propriétaire de cette ressource" });
    }

    // 3. Créer le partage
    const { data: share, error: shareError } = await supabase
      .from('ResourceShare')
      .upsert({
        resource_id: resourceId,
        resource_type: resourceType,
        owner_id: req.user.id,
        shared_with: targetUser.id,
        permission
      }, { onConflict: 'resource_id,shared_with' })
      .select()
      .single();

    if (shareError) throw shareError;

    res.json({ success: true, data: share });
  } catch (error) {
    console.error('CreateShare error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du partage' });
  }
};

/**
 * Lister les partages pour une ressource
 */
const listSharesByResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { data: shares, error } = await supabase
      .from('ResourceShare')
      .select('*, shared_with:User(id, name, email, avatar)')
      .eq('resource_id', resourceId);

    if (error) throw error;
    res.json({ success: true, data: shares });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des partages' });
  }
};

/**
 * Lister les ressources partagées avec moi
 */
const listMySharedResources = async (req, res) => {
  try {
    const { data: shares, error } = await supabase
      .from('ResourceShare')
      .select('*')
      .eq('shared_with', req.user.id);

    if (error) throw error;
    res.json({ success: true, data: shares });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
  }
};

/**
 * Mettre à jour une permission
 */
const updateShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;

    const { data: share, error } = await supabase
      .from('ResourceShare')
      .update({ permission })
      .eq('id', id)
      .eq('owner_id', req.user.id) // Seul le proprio peut changer les droits
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: share });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
};

/**
 * Révoquer un accès
 */
const deleteShare = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ResourceShare')
      .delete()
      .eq('id', id)
      .or(`owner_id.eq.${req.user.id},shared_with.eq.${req.user.id}`); // Le proprio ou celui avec qui c'est partagé

    if (error) throw error;
    res.json({ success: true, message: 'Accès révoqué' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = {
  createShare,
  listSharesByResource,
  listMySharedResources,
  updateShare,
  deleteShare
};
