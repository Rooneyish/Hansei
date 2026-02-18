const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const chatController = require('../controllers/chatController');

router.post('/chat', authenticate, chatController.handleChat);
router.post('/chat/new-session', authenticate, chatController.startNewSession);
router.get('/chat/sessions', authenticate, chatController.listSessions);
router.get('/chat/history/:sessionId', authenticate, chatController.getChatHistory);
router.get('/chat/history', authenticate, chatController.getChatHistory);
router.post('/chat/end-session', authenticate, chatController.handleEndSession);

module.exports = router