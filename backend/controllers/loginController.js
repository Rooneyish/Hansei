const queries = require('../database/queries');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function loginUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const user = await queries.findUserByUsername(username);
        console.log("User from DB:", user); 
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const expiresTime = '7d';

        const accessToken = jwt.sign(
            {id: user.user_id, username: user.username, email: user.email},
            process.env.ACCESS_TOKEN_SECRET, { expiresIn: expiresTime }
        );

        res.status(200).json({
            message: `User ${user.username} logged in successfully`,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                accessToken,
                expiresIn: expiresTime
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to login user' });
    }
}

async function logoutUser(req, res) {
    res.status(200).json({ message: 'User logged out successfully' });
}

module.exports = {
    loginUser,
    logoutUser
};