const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const insightsController = require("../controllers/insightsController");

router.get("/weekly", authenticate, insightsController.getWeeklyStats);

module.exports = router;
