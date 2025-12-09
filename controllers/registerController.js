const queries = require('../database/queries');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

async function registerUser(req, res) {
    const { username, email, password, confirm_password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (username == queries.findUserByUsername(username)) {
        return res.status(409).json({ error: 'Username already exists' });
    }

    if (email == queries.findUserByEmail(email)) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
        const newUser = new UserModel(null, username, email, hashedPassword);
        await queries.registerUser(newUser);
        res.status(201).json({
            message: `User ${newUser.username} registered successfully`,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
}



module.exports = {
    registerUser,
};