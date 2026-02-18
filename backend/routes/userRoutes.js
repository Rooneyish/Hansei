const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/userController');
const streakController = require('../controllers/streakController');
const journalController = require('../controllers/journalController'); 

// Profile Routes
router.get('/profile', authenticate, userController.showUserProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.patch('/profile/change-password', authenticate, userController.passwordReset);
router.delete('/profile', authenticate, userController.deleteUser);

// Streak Routes
router.post('/profile/check-in', authenticate, streakController.checkInUser);
router.get('/profile/streak', authenticate, streakController.getStreakCount);

// Journal Routes 
router.post('/journal/scan', authenticate, journalController.scanText);
router.post('/journal/submit', authenticate, journalController.submitJournal);

module.exports = router;