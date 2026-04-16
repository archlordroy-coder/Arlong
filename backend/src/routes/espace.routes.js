const express = require('express');
const router = express.Router();
const { createEspace, getEspaces, getEspaceById, updateEspace, deleteEspace, inviteUser, getStats } = require('../controllers/espace.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/', getEspaces);
router.post('/', createEspace);
router.get('/:id', getEspaceById);
router.put('/:id', updateEspace);
router.delete('/:id', deleteEspace);
router.post('/:id/invite', inviteUser);

module.exports = router;
