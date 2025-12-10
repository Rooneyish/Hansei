const pool = require('../database/db');
UserModel = require('../models/userModel');
loginmodel = require('../models/loginModel');


async function registerUser(UserModel) {
    const insertQuery = `
        INSERT INTO user_profile 
        (username, email, password) 
        VALUES ($1, $2, $3)
    `;

    const values = [
        UserModel.username,
        UserModel.email,
        UserModel.password,
    ];

    try {
        const result = await pool.query(insertQuery, values);
        if (result.rowCount > 0) {
            console.log(`User ${UserModel.username} registered successfully.`);
            return true;
        } else {
            return false;
        }

    } catch (error) {
        console.error('Error during user registration:', error.stack);
        throw error;
    }
}

async function findUserByUsername(username) {
    const query = 'SELECT * FROM user_profile WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user by username', err.stack);
        throw err;
    }
}

async function findUserByEmail(email) {
    const query = 'SELECT * FROM user_profile WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user by email', err.stack);
        throw err;
    }
}

async function loginUser(LoginModel) {
    const query = 'SELECT * FROM user_profile WHERE username = $1 AND password = $2';
    const values = [LoginModel.username, LoginModel.password];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error during user login', err.stack);
        throw err;
    }
}

async function updateProfile(updateData) {
    const query = `
        UPDATE user_profile 
        SET username = $2, email = $3
        WHERE id = $1
    `;

    const values = [
        updateData.id,
        updateData.username,
        updateData.email,
    ];

    try {
        const result = await pool.query(query, values);
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error updating user profile', err.stack);
        throw err;
    }
}

async function showUserProfile(userId) {
    const query = 'SELECT id, username, email FROM user_profile WHERE id = $1';
    const values = [userId];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error retrieving user profile', err.stack);
        throw err;
    }
}

// const test = new user(1, 'testuser', 'jfaskldfj', 'password123');
// updateProfile(test).then(result => {
//     console.log('Update result:', result);
// }).catch(err => {
//     console.error('Error during update test:', err);
// });   

module.exports = {
    registerUser, 
    findUserByUsername,
    findUserByEmail,
    updateProfile,
    showUserProfile
};