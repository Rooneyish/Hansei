const pool = require("./db");
UserModel = require("../models/userModel");

async function registerUser(userModel) {
  const client = await pool.query("BEGIN");
  try {
    const userInsert = `
            INSERT INTO users (username, email, password_hash) 
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email
        `;
    const userValues = [
      userModel.username,
      userModel.email,
      userModel.password,
    ];
    const userRes = await pool.query(userInsert, userValues);
    const newUser = userRes.rows[0];

    const progressInsert = `
            INSERT INTO user_progress (user_id, streak_count, longest_streak) 
            VALUES ($1, 0, 0)
        `;
    await pool.query(progressInsert, [newUser.user_id]);

    await pool.query("COMMIT");
    console.log(`User ${newUser.username} registered successfully.`);
    return newUser;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error during user registration:", error.stack);
    throw error;
  }
}

async function findUserByUsername(username) {
  const query = "SELECT * FROM users WHERE username = $1";
  const values = [username];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Error finding user by username", err.stack);
    throw err;
  }
}

async function findUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1";
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (err) {
    console.error("Error finding user by email", err.stack);
    throw err;
  }
}

async function updateUserProfile(userId, updateFields) {
  const fieldKeys = Object.keys(updateFields);
  if (fieldKeys.length === 0) {
    throw new Error("No fields to update");
  }

  const setClauses = fieldKeys.map((key, index) => `${key} = $${index + 2}`);

  const values = [userId, ...fieldKeys.map((key) => updateFields[key])];

  const query = `
        UPDATE users 
        SET ${setClauses} 
        WHERE user_id = $1
        RETURNING *
    `;

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    console.error("Error updating user profile", err.stack);
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
    console.error("Error retrieving user profile", err.stack);
    throw err;
  }
}

async function getPasswordByUserId(userId) {
  const query = "SELECT password_hash FROM users WHERE user_id = $1";
  const values = [userId];

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0].password_hash;
  } catch (err) {
    console.error("Error retrieving user password", err.stack);
    throw err;
  }
}

async function passwordReset(userId, newPassword) {
  const query = `
        UPDATE users 
        SET password_hash = $2 
        WHERE user_id = $1
        RETURNING *
    `;
  const values = [userId, newPassword];

  try {
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error resetting password", err.stack);
    throw err;
  }
}

async function deleteUser(userId) {
  const query = "DELETE FROM users WHERE user_id = $1";
  const values = [userId];

  try {
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error deleting user", err.stack);
    throw err;
  }
}

async function getStreak(userId) {
  const fetchQuery =
    "SELECT streak_count FROM user_progress WHERE user_id = $1";
  const values = [userId];

  try {
    const result = await pool.query(fetchQuery, values);
    const streak = result.rows[0];
    return streak;
  } catch (err) {
    console.error("Error finding streaks count", err.stack);
    throw err;
  }
}

async function checkInUser(userId) {
  const today = new Date();
  const todayString = today.toLocaleDateString("en-CA"); 

  const fetchQuery = `
        SELECT streak_count, last_activity, longest_streak
        FROM user_progress 
        WHERE user_id = $1
    `;

  try {
    const result = await pool.query(fetchQuery, [userId]);
    const userData = result.rows[0];

    if (!userData) throw new Error("User progress not found");

    let { streak_count, last_activity, longest_streak } = userData;

    let newStreak = streak_count;
    let newLongestStreak = longest_streak;
    let newLastCheckIn = todayString;

    const lastActiveStr = last_activity
      ? last_activity.toLocaleDateString("en-CA")
      : null;

    if (lastActiveStr === todayString) {
      return {
        streak_count: newStreak,
        longest_streak: newLongestStreak,
        message: "Already checked in today",
      };
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = yesterday.toLocaleDateString("en-CA");

    if (lastActiveStr === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    if (newStreak > newLongestStreak) newLongestStreak = newStreak;

    const updateQuery = `
            UPDATE user_progress 
            SET streak_count = $2, last_activity = $3, longest_streak = $4
            WHERE user_id = $1
            RETURNING streak_count, longest_streak
        `;

    const updateValues = [userId, newStreak, newLastCheckIn, newLongestStreak];
    const updateResult = await pool.query(updateQuery, updateValues);

    return {
      streak_count: updateResult.rows[0].streak_count,
      longest_streak: updateResult.rows[0].longest_streak,
      message: streak_count > 1 ? "Streak continued!" : "Streak started!",
    };
  } catch (err) {
    console.error("Error during check-in", err.stack);
    throw err;
  }
}

async function createJournalEntry(userId, content) {
  const query = `
        INSERT INTO journal_entries (user_id, encrypted_journal_content)
        VALUES ($1, $2)
        RETURNING *
    `;
  try {
    const result = await pool.query(query, [userId, content]);
    return result.rows[0];
  } catch (err) {
    console.error("Error saving journal entry", err.stack);
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
  getStreak,
  createJournalEntry,
};
