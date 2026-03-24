const queries = require("../database/queries");

async function getWeeklyStats(req, res) {
  const userId = req.user.user_id || req.user.id;

  const range = req.query.range || "7 days";

  try {
    const stats = await queries.getDashboardStats(userId, range);

    const totalMinutes = Math.floor((stats.total_zen_seconds || 0) / 60);

    res.json({
      success: true,
      journals: parseInt(stats.total_journals) || 0,
      meditationMins: totalMinutes,
      reframes: parseInt(stats.total_reframes) || 0,
      emotions: stats.emotion_distribution || [],
    });
  } catch (error) {
    console.error("Insights Logic Error:", error);
    res.status(500).json({ error: "Failed to load mirror stats." });
  }
}

module.exports = { getWeeklyStats };
