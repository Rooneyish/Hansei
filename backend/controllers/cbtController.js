const queries = require("../database/queries");

async function getCBTHistory(req, res) {
  const userId = req.user.id;

  try {
    const history = await queries.getCBTHistory(userId);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve CBT lab history" });
  }
}

async function saveCBTResult(req, res) {
  const userId = req.user.user_id || req.user.id;
  const { distortion, thought, reframe } = req.body;

  try {
    const dbResult = await queries.saveCBTResult(
      userId,
      null, 
      distortion,
      thought,
      reframe,
    );

    const rewards = await queries.updateDailyRitual(userId, "cbt");

    res.status(201).json({
      success: true,
      data: dbResult,
      rewards: rewards,
    });
  } catch (error) {
    console.error("CBT Controller Error:", error);
    res.status(500).json({ error: "Server error during sealing." });
  }
}

module.exports = {
  getCBTHistory,
  saveCBTResult
};
