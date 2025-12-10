const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controllers/userController');

// router.get('/users', authenticate, userController.getAllUsers);
router.get('/users/:id', authenticate, userController.showUserProfile);
router.patch('/users/:id', authenticate, userController.updateProfile);

module.exports = router;