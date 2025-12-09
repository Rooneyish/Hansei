const queries = require('../database/queries');

async function updateProfile(req, res) {
    const { userId, username, email } = req.body;

    if (!userId || !username || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const updateData = {
        id: userId,
        username: username,
        email: email,
    }

    try {
        await queries.updateUserProfile(updateData);
        res.status(200).json({
            message: `User profile updated successfully`,
            user: {
                id: userId,
                username: username,
                email: email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user profile' });
    }
}


module.exports = {
    updateProfile,
};