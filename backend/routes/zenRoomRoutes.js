const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const zenRoomController = require('../controllers/zenRoomController');

router.post('/save', authenticate, zenRoomController.saveMeditationSession);
router.get('/intention', authenticate, zenRoomController.getZenIntention);

module.exports = router