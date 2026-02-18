const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const chatController = require('../controllers/chatController');

router.post('/chat', authenticate, chatController.handleChat);

module.exports = router