const express = require('express');
const router = express.Router();
const { createDossier, getDossiers, getDossierById, updateDossier, deleteDossier, toggleVisibility } = require('../controllers/dossier.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', getDossiers);
router.post('/', createDossier);
router.get('/:id', getDossierById);
router.put('/:id', updateDossier);
router.delete('/:id', deleteDossier);
router.patch('/:id/visibility', toggleVisibility);

module.exports = router;
