const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const musicController = require("../controllers/musicController");

router.get("/music/all", authenticate, musicController.getAllMusic);

module.exports = router;
