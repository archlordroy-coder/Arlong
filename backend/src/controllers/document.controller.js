const supabase = require('../config/supabase');
const driveService = require('../services/googleDrive.service');
const multer = require('multer');
const path = require('path');

// Multer en mémoire (buffer) pour transfert direct vers Google Drive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else {
      const error = new Error(`Le type de fichier "${ext}" n'est pas autorisé. Extensions admises : ${allowed.join(', ')}`);
      error.status = 400;
      cb(error);
    }
  },
});

/** Upload et importer un document */
const importDocument = async (req, res) => {
  try {
    const { dossierId, name } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    if (!dossierId) return res.status(400).json({ success: false, message: 'dossierId requis' });

    // Récupérer l'utilisateur pour son token Drive
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('google_refresh_token')
      .eq('id', req.user.id)
      .single();

    if (userError || !user?.google_refresh_token) {
      return res.status(403).json({ success: false, message: "Vous devez lier votre compte Google Drive pour importer des documents." });
    }

    // Vérifier que le dossier existe et est accessible
    const { data: dossier, error: dossierError } = await supabase
      .from('Dossier')
      .select('id, name, createdById, isPublic, espace:Espace(id, name)')
      .eq('id', parseInt(dossierId))
      .or(`createdById.eq.${req.user.id},isPublic.eq.true`)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé ou inaccessible' });
    }

    // Chemin hiérarchique : Arlong / [Espace] / [Dossier]
    const pathSegments = ['Arlong'];
    if (dossier.espace?.name) pathSegments.push(dossier.espace.name);
    pathSegments.push(dossier.name);

    const fileName = name || file.originalname;
    const fileType = path.extname(file.originalname).substring(1).toLowerCase();

    // Upload vers Google Drive de l'utilisateur avec le chemin hierarchique
    const driveFile = await driveService.uploadFile(
      file.buffer, 
      fileName, 
      file.mimetype, 
      user.google_refresh_token,
      pathSegments
    );

    const filePath = driveFile.webViewLink; // Lien consultable sur Drive
    const driveId = driveFile.id; // ID unique du fichier sur Drive

    // Créer le document en base
    const { data: document, error: docError } = await supabase
      .from('Document')
      .insert([{
        name: fileName,
        type: fileType,
        path: filePath,
        driveId,
        dossierId: parseInt(dossierId),
      }])
      .select()
      .single();

    if (docError) throw docError;

    // Enregistrer dans l'historique
    await supabase.from('Historique').insert([{
      actionType: 'Importation',
      docId: document.id,
      userId: req.user.id,
    }]);

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur lors de l\'import' });
  }
};

/** Lister les documents d'un dossier */
const getDocuments = async (req, res) => {
  try {
    const { dossierId, search, type } = req.query;

    let query = supabase
      .from('Document')
      .select(`
        *,
        dossier:Dossier(id, name, createdById, isPublic, espace:Espace(id, name))
      `)
      .eq('isDeleted', false);

    if (dossierId) {
      query = query.eq('dossierId', parseInt(dossierId));
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: documents, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Filtrage post-requête pour la sécurité (Dossiers privés)
    const filteredDocs = documents.filter(doc => 
        doc.dossier.createdById === req.user.id || doc.dossier.isPublic === true
    );

    res.json({ success: true, data: filteredDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/** Obtenir un document par ID */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabase
      .from('Document')
      .select(`
        *,
        dossier:Dossier(id, name, createdById, isPublic, espace:Espace(id, name))
      `)
      .eq('id', parseInt(id))
      .eq('isDeleted', false)
      .single();

    if (error || !document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    // Vérification accès
    if (document.dossier.createdById !== req.user.id && !document.dossier.isPublic) {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Log de consultation
    await supabase.from('Historique').insert([{
        actionType: 'Consultation',
        docId: document.id,
        userId: req.user.id,
    }]);

    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/** Télécharger un document */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: document, error: docError } = await supabase
      .from('Document')
      .select(`
        *,
        dossier:Dossier(id, name, createdById, isPublic, espace:Espace(id, name))
      `)
      .eq('id', parseInt(id))
      .eq('isDeleted', false)
      .single();

    if (docError || !document) return res.status(404).json({ success: false, message: 'Document non trouvé' });

    // Accès ?
    if (document.dossier.createdById !== req.user.id && !document.dossier.isPublic) {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    if (!document.driveId) {
      return res.status(400).json({ success: false, message: 'Fichier non disponible sur Google Drive' });
    }

    // Récupérer le token de l'utilisateur actuel
    const { data: user, error: userError } = await supabase
        .from('User')
        .select('google_refresh_token')
        .eq('id', req.user.id)
        .single();

    if (userError || !user?.google_refresh_token) {
      return res.status(403).json({ success: false, message: "Vous devez relier votre compte Google Drive." });
    }

    const buffer = await driveService.downloadFile(document.driveId, user.google_refresh_token);

    // Historique
    await supabase.from('Historique').insert([{
        actionType: 'Téléchargement',
        docId: document.id,
        userId: req.user.id,
    }]);

    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du téléchargement.' });
  }
};

/** Déplacer un document vers un autre dossier */
const moveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDossierId } = req.body;

    // 1. Vérifier si le document existe et si l'utilisateur y a accès
    const { data: document, error: docError } = await supabase
      .from('Document')
      .select('id, dossier:Dossier(createdById)')
      .eq('id', parseInt(id))
      .single();

    if (docError || !document) return res.status(404).json({ success: false, message: 'Document introuvable' });
    if (document.dossier.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé pour déplacer ce document' });
    }

    // 2. Vérifier si le nouveau dossier existe et si l'utilisateur y a accès
    const { data: newDossier, error: newDossierError } = await supabase
      .from('Dossier')
      .select('id, createdById')
      .eq('id', parseInt(newDossierId))
      .single();

    if (newDossierError || !newDossier) return res.status(404).json({ success: false, message: 'Dossier de destination introuvable' });
    if (newDossier.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé au dossier de destination' });
    }

    const { data: updated, error } = await supabase
      .from('Document')
      .update({ dossierId: parseInt(newDossierId) })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    await supabase.from('Historique').insert([{
        actionType: 'Déplacement',
        docId: parseInt(id),
        userId: req.user.id,
    }]);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du déplacement' });
  }
};

/** Suppression logique */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès
    const { data: document, error: docError } = await supabase
      .from('Document')
      .select('id, dossier:Dossier(createdById)')
      .eq('id', parseInt(id))
      .single();

    if (docError || !document) return res.status(404).json({ success: false, message: 'Document introuvable' });
    if (document.dossier.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé pour supprimer ce document' });
    }

    const { error } = await supabase
      .from('Document')
      .update({ isDeleted: true })
      .eq('id', parseInt(id));

    if (error) throw error;

    await supabase.from('Historique').insert([{
        actionType: 'Suppression',
        docId: parseInt(id),
        userId: req.user.id,
    }]);

    res.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = { upload, importDocument, getDocuments, getDocumentById, downloadDocument, moveDocument, deleteDocument };
