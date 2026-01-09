const pool = require('./db');
UserModel = require('../models/userModel');

async function registerUser(userModel) {
    // We use a Transaction to ensure both tables are updated
    const client = await pool.query('BEGIN');
    try {
        // 1. Insert into users table
        const userInsert = `
            INSERT INTO users (username, email, password_hash) 
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email
        `;
        const userValues = [userModel.username, userModel.email, userModel.password];
        const userRes = await pool.query(userInsert, userValues);
        const newUser = userRes.rows[0];

        // 2. Initialize progress in user_progress table (FR1 & FR6)
        const progressInsert = `
            INSERT INTO user_progress (user_id, streak_count, longest_streak) 
            VALUES ($1, 0, 0)
        `;
        await pool.query(progressInsert, [newUser.user_id]);

        await pool.query('COMMIT');
        console.log(`User ${newUser.username} registered successfully.`);
        return newUser;
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error during user registration:', error.stack);
        throw error;
    }
}

async function findUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
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
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
        const result = await pool.query(query, [email]);
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user by email', err.stack);
        throw err;
    }
}

async function updateUserProfile(userId, updateFields) {
    const fieldKeys = Object.keys(updateFields);
    if (fieldKeys.length === 0) {
        throw new Error('No fields to update');
    }

    const setClauses = fieldKeys.map((key, index) => `${key} = $${index + 2}`);

    const values = [userId, ...fieldKeys.map(key => updateFields[key])];

    const query = `
        UPDATE users 
        SET ${setClauses} 
        WHERE id = $1
        RETURNING *
    `;


    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error updating user profile', err.stack);
        throw err;
    }
}

async function showUserProfile(userId) {
    const query = `
        SELECT u.user_id, u.username, u.email, p.streak_count, p.longest_streak 
        FROM users u
        JOIN user_progress p ON u.user_id = p.user_id
        WHERE u.user_id = $1
    `;
    try {
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    } catch (err) {
        console.error('Error retrieving user profile', err.stack);
        throw err;
    }
}

async function getPasswordByUserId(userId) {
    const query = 'SELECT password FROM users WHERE id = $1';
    const values = [userId];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0].password;
    } catch (err) {
        console.error('Error retrieving user password', err.stack);
        throw err;
    }
}

async function passwordReset(userId, newPassword) {
    const query = `
        UPDATE users 
        SET password = $2 
        WHERE id = $1
        RETURNING *
    `;
    const values = [userId, newPassword];

    try {
        const result = await pool.query(query, values);
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error resetting password', err.stack);
        throw err;
    }
}

async function deleteUser(userId) {
    const query = 'DELETE FROM users WHERE id = $1';
    const values = [userId];

    try {
        const result = await pool.query(query, values);
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error deleting user', err.stack);
        throw err;
    }
}

async function getStreak(userId){
    const fetchQuery='SELECT streak_count FROM user_progress WHERE id = $1';
    const values = [userId]
    
    try{
        const result = await pool.query(fetchQuery, values)
        const streak = result.rows[0]
        return streak
    }
    catch(err){
        console.error('Error finding streaks count', err.stack)
        throw err
    }
}

async function checkInUser(userId) {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    // Fetch from user_progress table
    const fetchQuery = `
        SELECT streak_count, last_activity, longest_streak
        FROM user_progress 
        WHERE user_id = $1
    `;

    try {
        const result = await pool.query(fetchQuery, [userId]);
        const userData = result.rows[0];

        if (!userData) throw new Error('User progress not found');

        let { streak_count, last_activity, longest_streak } = userData;
        const lastActiveStr = last_activity ? new Date(last_activity).toLocaleDateString('en-CA') : null;

        if (lastActiveStr === todayString) {
            return { streak_count, longest_streak, message: 'Already checked in today' };
        }

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayString = yesterday.toLocaleDateString('en-CA');

        if (lastActiveStr === yesterdayString) {
            streak_count += 1;
        } else {
            streak_count = 1;
        }

        if (streak_count > longest_streak) longest_streak = streak_count;

        const updateQuery = `
            UPDATE user_progress 
            SET streak_count = $2, last_activity = $3, longest_streak = $4
            WHERE user_id = $1
            RETURNING streak_count, longest_streak
        `;
        const updateRes = await pool.query(updateQuery, [userId, streak_count, todayString, longest_streak]);
        
        return { 
            streak_count: updateRes.rows[0].streak_count, 
            longest_streak: updateRes.rows[0].longest_streak,
            message: streak_count > 1 ? 'Streak continued!' : 'Streak started!'
        };
    } catch(err) {
        console.error('Error during check-in', err.stack);
        throw err;
    }
}

module.exports = {
    registerUser, 
    findUserByUsername,
    findUserByEmail,
    updateUserProfile,
    showUserProfile,
    passwordReset,
    getPasswordByUserId,
    deleteUser,
    checkInUser,
    getStreak
};