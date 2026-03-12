const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const cbtController = require('../controllers/cbtController');

router.get('/history', authenticate, cbtController.getCBTHistory);

module.exports = router;