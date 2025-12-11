const queries = require('../database/queries');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

async function registerUser(req, res) {
    const { username, email, password, confirm_password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (username == await queries.findUserByUsername(username)) {
        return res.status(409).json({ error: 'Username already exists' });
    }

    if (email == await queries.findUserByEmail(email)) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        const newUser = new UserModel(null, username, email, hashedPassword);
        const registeredUser = await queries.registerUser(newUser);

        if (!registeredUser) {
            return res.status(500).json({ error: 'User registration failed' });
        }
        
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