const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const registerController = require('../controllers/registerController');
console.log("routes file loaded");

router.post('/register', registerController.registerUser);
router.post('/login', loginController.loginUser);
router.post('/logout', loginController.logoutUser);
router.post('/refresh', loginController.refreshToken);
router.get('/verify', loginController.verifyToken)

module.exports = router;