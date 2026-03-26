const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

router.get('/stats', authenticate, isAdmin, adminController.getPlatformStats);

module.exports = router;