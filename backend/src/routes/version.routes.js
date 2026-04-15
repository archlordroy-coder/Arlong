const express = require('express');
const router = express.Router();
const {
  getLatestVersion,
  listVersions,
  createVersion,
  updateVersion,
  deleteVersion
} = require('../controllers/version.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Public : Récupérer la dernière mise à jour
router.get('/latest', getLatestVersion);

// Admin : Gérer les versions
router.get('/', authMiddleware, adminMiddleware, listVersions);
router.post('/', authMiddleware, adminMiddleware, createVersion);
router.put('/:id', authMiddleware, adminMiddleware, updateVersion);
router.delete('/:id', authMiddleware, adminMiddleware, deleteVersion);

module.exports = router;
