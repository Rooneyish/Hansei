const queries = require('../database/queries');

async function checkInUser(req, res) {
    const userId = req.user.id;

    try {
        const result = await queries.checkInUser(userId);
        
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

module.exports = {
    checkInUser
};