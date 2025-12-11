const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/userController');

// router.get('/users', authenticate, userController.getAllUsers);
router.get('/profile', authenticate, userController.showUserProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.patch('/profile/change-password', authenticate, userController.passwordReset);
router.delete('/profile', authenticate, userController.deleteUser);

module.exports = router;