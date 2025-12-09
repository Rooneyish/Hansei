const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const loginController = require('../controllers/loginController');
const registerController = require('../controllers/registerController');

router.post('/register', registerController.registerUser);
router.post('/login', loginController.loginUser);

module.exports = router;