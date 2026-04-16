const express = require('express');
const router = express.Router();
const {
  createShare,
  listSharesByResource,
  listMySharedResources,
  updateShare,
  deleteShare
} = require('../controllers/share.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', createShare);
router.get('/me', listMySharedResources);
router.get('/resource/:resourceId', listSharesByResource);
router.put('/:id', updateShare);
router.delete('/:id', deleteShare);

module.exports = router;
