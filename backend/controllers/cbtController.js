const queries = require('../database/queries');

async function getCBTHistory(req, res) {
  const userId = req.user.id; 

  try {
    const history = await queries.getCBTHistory(userId);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve CBT lab history' });
  }
}

module.exports = {
  getCBTHistory,
};