const supabase = require('../config/supabase');
const driveService = require('../services/googleDrive.service');
const path = require('path');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const importDocument = async (req, res, next) => {
  try {
    const { dossierId, name } = req.body;
    const file = req.file;
    if (!file || !dossierId) throw new Error('Fichier et dossierId requis');
    const { data: user } = await supabase.from('User').select('googleRefreshToken').eq('id', req.user.id).single();
    if (!user?.googleRefreshToken) throw new Error('Veuillez relier votre compte Google Drive.');
    const driveFile = await driveService.uploadFile(file.buffer, name || file.originalname, file.mimetype, user.googleRefreshToken);
    const { data: document, error } = await supabase.from('Document').insert([{
      name: name || file.originalname,
      type: path.extname(file.originalname).substring(1),
      path: driveFile.webViewLink,
      driveId: driveFile.id,
      dossierId: dossierId === 'root' ? null : dossierId,
      size: file.size,
      createdById: req.user.id
    }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = supabase.from('Document').select('*, dossier:Dossier(name)').eq('createdById', req.user.id).eq('isDeleted', false);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDocumentById = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('Document').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const updateDocument = async (req, res, next) => {
    try {
        const { name } = req.body;
        const { data, error } = await supabase.from('Document').update({ name }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { data: document } = await supabase.from('Document').select('*').eq('id', req.params.id).single();
    const { data: user } = await supabase.from('User').select('googleRefreshToken').eq('id', req.user.id).single();
    const buffer = await driveService.downloadFile(document.driveId, user.googleRefreshToken);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const moveDocument = async (req, res, next) => {
    try {
        const { dossierId } = req.body;
        const { data, error } = await supabase.from('Document').update({ dossierId }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const deleteDocument = async (req, res, next) => {
  try {
    await supabase.from('Document').update({ isDeleted: true }).eq('id', req.params.id);
    res.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, importDocument, getDocuments, getDocumentById, downloadDocument, updateDocument, moveDocument, deleteDocument };
