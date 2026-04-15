const express = require('express');
const router = express.Router();
const { sendEmailWithAttachments, listInbox } = require('../controllers/gmail.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/send', sendEmailWithAttachments);
router.get('/inbox', listInbox);

module.exports = router;
