const express = require('express');
const router = express.Router();
const { getHistorique } = require('../controllers/historique.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', getHistorique);

module.exports = router;
