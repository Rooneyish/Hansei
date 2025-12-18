const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const registerController = require('../controllers/registerController');

router.post('/register', registerController.registerUser);
router.post('/login', loginController.loginUser);
router.post('/logout', loginController.logoutUser);

module.exports = router;