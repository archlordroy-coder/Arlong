const express = require('express');
const router = express.Router();
const { getHistorique, deleteHistoriqueItem, clearAllHistorique } = require('../controllers/historique.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', getHistorique);
router.delete('/:id', deleteHistoriqueItem);
router.delete('/clear-all', clearAllHistorique);

module.exports = router;
