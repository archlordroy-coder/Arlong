const express = require('express');
const router = express.Router();
const {
  upload, importDocument, getDocuments, getDocumentById,
  downloadDocument, moveDocument, deleteDocument, updateDocument
} = require('../controllers/document.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', getDocuments);
router.post('/', upload.single('file'), importDocument);
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.get('/:id/download', downloadDocument);
router.patch('/:id/move', moveDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
