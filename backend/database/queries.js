const pool = require('./db');
UserModel = require('../models/userModel');

async function registerUser(UserModel) {
    const insertQuery = `
        INSERT INTO user_profile 
        (username, email, password) 
        VALUES ($1, $2, $3)
        RETURNING id, username, email
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
            return result.rows[0];
        }else {
            return null;
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

async function updateUserProfile(userId, updateFields) {
    const fieldKeys = Object.keys(updateFields);
    if (fieldKeys.length === 0) {
        throw new Error('No fields to update');
    }

    const setClauses = fieldKeys.map((key, index) => `${key} = $${index + 2}`);

    const values = [userId, ...fieldKeys.map(key => updateFields[key])];

    const query = `
        UPDATE user_profile 
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

async function getPasswordByUserId(userId) {
    const query = 'SELECT password FROM user_profile WHERE id = $1';
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
        UPDATE user_profile 
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
    const query = 'DELETE FROM user_profile WHERE id = $1';
    const values = [userId];

    try {
        const result = await pool.query(query, values);
        return result.rowCount > 0;
    } catch (err) {
        console.error('Error deleting user', err.stack);
        throw err;
    }
}

async function checkInUser(userId) {
    const today = new Date();

    const todayString = today.toISOString().split('T')[0];
    
    const fetchQuery = `
        SELECT current_streak, last_active_date, longest_streak
        FROM user_profile 
        WHERE id = $1
    `;

    const values = [userId];

    try{
        const result = await pool.query(fetchQuery, values);
        const userData = result.rows[0];

        if (!userData) {
            throw new Error('User not found');
        }

        const {current_streak, last_active_date, longest_streak} = userData;
        
        let newStreak = current_streak;
        let newLongestStreak = longest_streak;
        let newLastCheckIn = todayString;

        const lastActiveStr = last_active_date ? last_active_date.toISOString().split('T')[0] : null;

        if (lastActiveStr === todayString) {
            return { current_streak: newStreak, longest_streak: newLongestStreak, message: 'Already checked in today' };
        }

        const yesterday = new Date(today);
        yesterday.setUTCHours(0, 0, 0, 0);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (lastActiveStr === yesterdayString) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }

        if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
        }

        const updateQuery = `
            UPDATE user_profile 
            SET current_streak = $2, last_active_date = $3 , longest_streak = $4
            WHERE id = $1
            RETURNING current_streak, longest_streak
        `;
        const updateValues = [userId, newStreak, newLastCheckIn, newLongestStreak];
        const updateResult =  await pool.query(updateQuery, updateValues);
        
        return { 
            current_streak: updateResult.rows[0].current_streak, 
            longest_streak: updateResult.rows[0].longest_streak,
            message:newStreak > 1 ? 'Streak continued!' : 'Streak started/reset!'
        };
    }catch(err){
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
    checkInUser
};