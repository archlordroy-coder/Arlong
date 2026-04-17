const supabase = require('../config/supabase');

/**
 * Créer ou mettre à jour une liste de contacts
 */
const saveContactList = async (req, res) => {
  try {
    const { name, contacts, source_file } = req.body;

    if (!name || !contacts) {
      return res.status(400).json({ success: false, message: 'Le nom et les contacts sont requis' });
    }

    const { data: list, error } = await supabase
      .from('ContactList')
      .upsert({
        name,
        contacts,
        source_file,
        owner_id: req.user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('SaveContactList error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde' });
  }
};

/**
 * Lister mes listes de contacts
 */
const listMyContactLists = async (req, res) => {
  try {
    const { data: lists, error } = await supabase
      .from('ContactList')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('updatedAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
  }
};

/**
 * Supprimer une liste de contacts
 */
const deleteContactList = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ContactList')
      .delete()
      .eq('id', id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Liste supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = {
  saveContactList,
  listMyContactLists,
  deleteContactList
};
