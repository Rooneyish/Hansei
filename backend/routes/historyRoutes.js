const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate')
const historyController = require('../controllers/historyController')

router.get('/chat/history/:sessionId', authenticate, historyController.getChatHistory);
router.get('/chat/history', authenticate, historyController.getChatHistory);
router.delete('/chat/sessions/:sessionId', authenticate, historyController.deleteChatHistory);

module.exports = router