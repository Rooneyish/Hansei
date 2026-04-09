const queries = require("../database/queries");

async function getPlatformStats(req, res) {
  try {
    const data = await queries.getPlatformStats();

    res.status(200).json({
      success: true,
      stats: data.metrics,
      recentUsers: data.recentUsers,
      safetyLogs: data.safetyLogs,
    });
  } catch (err) {
    console.error("Admin Stats Controller Error:", err);
    res.status(500).json({ error: "Failed to fetch platform metrics." });
  }
}

module.exports = { getPlatformStats };
