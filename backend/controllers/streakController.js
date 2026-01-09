const queries = require('../database/queries');

async function checkInUser(req, res) {
    const userId = req.user.id;

    try {
        const result = await queries.checkInUser(userId);
        console.log(result)
        res.status(200).json({
            message: result.message,
            streak: result.streak_count,
            longest_streak: result.longest_streak,
            userId: userId
        });
    } catch (err) {
        console.error('Error in checkInUser controller', err);
        res.status(500).json({ error: 'Failed to check in user'});
    }
}

async function getStreakCount(req, res) {
    const userId = req.user.id;
    try {
        const result = await queries.getStreak(userId);
        const streak_count = result ? result.streak_count : 0;

        res.status(200).json({
            streak: streak_count
        });
    } catch (err) {
        console.error('Error in getStreakCount controller', err);
        res.status(500).json({ error: 'Failed to fetch streak'});
    }
}

module.exports = {
    checkInUser,
    getStreakCount
};