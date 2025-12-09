const queries = require('../database/queries');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoginModel = require('../models/loginModel');
require('dotenv').config();

async function loginUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {

        const loginData = new LoginModel(username, password);

        if (!loginData.username || !loginData.password) {
            return res.status(400).json({ error: 'Invalid login data' });
        }

        const user = await queries.findUserByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const accessToken = jwt.sign(
            {id: user.id, username: user.username, email: user.email},
            process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }
        );

        res.status(200).json({
            message: `User ${user.username} logged in successfully`,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to login user' });
    }
}

module.exports = {
    loginUser,
};