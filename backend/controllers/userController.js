const queries = require('../database/queries');
const bcrypt = require('bcryptjs');

async function showUserProfile(req, res) {
    const userId = req.user.id;
    console.log("User ID:", userId);

    try {
        const user = await queries.showUserProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                current_streak: user.current_streak,
                longest_streak: user.longest_streak
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
}

async function deleteUser(req, res) {
    const userId = req.user.id;

    try {
        const deleted = await queries.deleteUser(userId);
        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: `User ${userId} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
}

async function updateProfile(req, res) {
    const  userId  = req.user.id;
    const { username, email } = req.body;

    const updateField = {};

    if (username){
        const usernameExists = await queries.findUserByUsername(username);
        if (usernameExists && usernameExists.id !== parseInt(userId)) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        updateField.username = username;
    } 
    if (email) {
        const emailExists = await queries.findUserByEmail(email);
        if (emailExists && emailExists.id !== parseInt(userId)) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        updateField.email = email;
    }

    const fieldKeys = Object.keys(updateField);
    if (fieldKeys.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    try {
        const updatedUser = await queries.updateUserProfile(userId,updateField);
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: `User profile updated successfully`,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user profile' });
    }
}

async function passwordReset(req, res) {
    const userId = req.user.id;
    const {current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const storedPassword = await queries.getPasswordByUserId(userId);
        const isMatch = await bcrypt.compare(current_password, storedPassword);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(new_password, salt);
        await queries.passwordReset(userId, hashedNewPassword);
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
}

module.exports = {
    updateProfile,
    showUserProfile,
    passwordReset,
    deleteUser,
};