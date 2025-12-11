const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/userController');

// router.get('/users', authenticate, userController.getAllUsers);
router.get('/users/:id', authenticate, userController.showUserProfile);
router.patch('/users/:id/update-profile', authenticate, userController.updateProfile);
router.patch('/users/:id/change-password', authenticate, userController.passwordReset);

module.exports = router;