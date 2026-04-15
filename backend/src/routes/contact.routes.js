const express = require('express');
const router = express.Router();
const {
  saveContactList,
  listMyContactLists,
  deleteContactList
} = require('../controllers/contact.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', saveContactList);
router.get('/', listMyContactLists);
router.delete('/:id', deleteContactList);

module.exports = router;
