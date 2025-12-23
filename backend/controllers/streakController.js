const queries = require('../database/queries');

async function checkInUser(req, res) {
    const userId = req.user.id;

    try {
        const result = await queries.checkInUser(userId);
        console.log(result)
        res.status(200).json({
            message: result.message,
            streak: result.current_streak,
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
        const currentStreak = result ? result.current_streak : 0;

        res.status(200).json({
            streak: currentStreak
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