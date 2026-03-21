const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const musicController = require("../controllers/musicController");

router.get("/music/all", musicController.getAllMusic);
router.post("/music/sessions", authenticate, musicController.saveBulkSession);
module.exports = router;
