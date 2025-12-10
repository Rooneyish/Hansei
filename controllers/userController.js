const queries = require('../database/queries');

async function showUserProfile(req, res) {
    const userId = req.params.id;

    const authenticatedUserId = req.user.id;
    if (parseInt(userId) !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const user = await queries.showUserProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
}

async function updateProfile(req, res) {
    const  userId  = req.params.id;
    const { username, email } = req.body;

    const authenticatedUserId = req.user.id;
    if (parseInt(userId) !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const updateField = {};

    if (username) updateField.username = username;
    if (email) updateField.email = email;

    const fieldKeys = Object.keys(updateField);
    if (fieldKeys.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    try {
        await queries.updateUserProfile(userId,updateField);
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
    showUserProfile
};