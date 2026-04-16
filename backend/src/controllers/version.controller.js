const githubService = require('../services/github.service');
const supabase = require('../config/supabase');

/**
 * Récupérer la dernière version valide
 */

const getLatestVersion = async (req, res) => {
  try {
    const { platform, allow_beta } = req.query; // desktop, web, mobile

    let query = supabase
      .from('AppVersion')
      .select('*')
      .eq('is_valid', true)
      .order('version_code', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (allow_beta !== 'true') {
      query = query.eq('is_beta', false);
    }

    const { data: versions, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: versions[0] || null
    });
  } catch (error) {
    console.error('GetLatestVersion error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la version' });
  }
};


/**
 * Lister toutes les versions (Admin)
 */
const listVersions = async (req, res) => {
  try {
    const { data: versions, error } = await supabase
      .from('AppVersion')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des versions' });
  }
};

/**
 * Créer une nouvelle version (Admin)
 */

const createVersion = async (req, res) => {
  try {
    const { version_name, version_code, platform, download_url, notes, is_valid, is_beta, github_sha } = req.body;

    const { data: version, error } = await supabase
      .from('AppVersion')
      .insert([{
        version_name,
        version_code,
        platform,
        download_url,
        notes,
        is_valid: is_valid !== undefined ? is_valid : true,
        is_beta: is_beta || false,
        github_sha
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la version' });
  }
};


/**
 * Mettre à jour une version (Admin)
 */
const updateVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: version, error } = await supabase
      .from('AppVersion')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
};

/**
 * Supprimer une version (Admin)
 */
const deleteVersion = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('AppVersion')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Version supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};


/**
 * Lister les commits GitHub pour création de version
 */
const listGitHubCommits = async (req, res) => {
  try {
    const commits = await githubService.getCommits();
    res.json({ success: true, data: commits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listGitHubCommits,
  getLatestVersion,
  listVersions,
  createVersion,
  updateVersion,
  deleteVersion
};
