const pool = require("./db");

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
            INSERT INTO user_progress (user_id, streak_count, longest_streak, current_mood) 
            VALUES ($1, 0, 0, 'Reflective ✨')
        `;
    await pool.query(progressInsert, [newUser.user_id]);

    await pool.query("COMMIT");
    return newUser;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error during user registration:", error.stack);
    throw error;
  }
}

async function findUserByUsername(username) {
  const query = "SELECT * FROM users WHERE username = $1";
  const result = await pool.query(query, [username]);
  return result.rows[0];
}

async function findUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

async function getPasswordByUserId(userId) {
  const query = "SELECT password_hash FROM users WHERE user_id = $1";
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.password_hash;
}

async function showUserProfile(userId) {
  const query = `
        SELECT u.user_id, u.username, u.email, p.streak_count, p.longest_streak, p.current_mood 
        FROM users u
        JOIN user_progress p ON u.user_id = p.user_id
        WHERE u.user_id = $1
    `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

async function updateUserProfile(userId, updateFields) {
  const fieldKeys = Object.keys(updateFields);
  if (fieldKeys.length === 0) throw new Error("No fields to update");
  const setClauses = fieldKeys
    .map((key, index) => `${key} = $${index + 2}`)
    .join(", ");
  const values = [userId, ...fieldKeys.map((key) => updateFields[key])];
  const query = `UPDATE users SET ${setClauses} WHERE user_id = $1 RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function createJournalEntry(userId, content) {
  const query = `
        INSERT INTO journal_entries (user_id, encrypted_journal_content)
        VALUES ($1, $2)
        RETURNING journal_id, user_id, created_at
    `;
  try {
    const result = await pool.query(query, [userId, content]);
    return result.rows[0];
  } catch (err) {
    console.error("Error saving journal entry", err.stack);
    throw err;
  }
}

async function saveEmotionAnalysis(journalId, emotion, confidence) {
  const query = `
        INSERT INTO emotion_analysis (journal_id, primary_emotion, confidence_score)
        VALUES ($1, $2, $3)
    `;
  try {
    await pool.query(query, [journalId, emotion, confidence]);
  } catch (err) {
    console.error("Error saving emotion analysis", err.stack);
  }
}

async function updateStatusAndMood(userId, moodStatus) {
  const query = `
        UPDATE user_progress 
        SET current_mood = $2
        WHERE user_id = $1
    `;
  try {
    await pool.query(query, [userId, moodStatus]);
  } catch (err) {
    console.error("Error updating mood status", err.stack);
  }
}

async function getStreak(userId) {
  const query = "SELECT streak_count FROM user_progress WHERE user_id = $1";
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

async function checkInUser(userId) {
  const today = new Date();
  const todayString = today.toLocaleDateString("en-CA");

  const fetchQuery = `SELECT streak_count, last_activity, longest_streak FROM user_progress WHERE user_id = $1`;
  const result = await pool.query(fetchQuery, [userId]);
  const userData = result.rows[0];

  if (!userData) throw new Error("User progress not found");

  let { streak_count, last_activity, longest_streak } = userData;
  const lastActiveStr = last_activity
    ? new Date(last_activity).toLocaleDateString("en-CA")
    : null;

  if (lastActiveStr === todayString) {
    return {
      streak_count,
      longest_streak,
      message: "Already checked in today",
    };
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayString = yesterday.toLocaleDateString("en-CA");

  let newStreak = lastActiveStr === yesterdayString ? streak_count + 1 : 1;
  let newLongestStreak = Math.max(newStreak, longest_streak);

  const updateQuery = `
        UPDATE user_progress 
        SET streak_count = $2, last_activity = $3, longest_streak = $4
        WHERE user_id = $1
        RETURNING streak_count, longest_streak
    `;
  const updateResult = await pool.query(updateQuery, [
    userId,
    newStreak,
    todayString,
    newLongestStreak,
  ]);

  return {
    streak_count: updateResult.rows[0].streak_count,
    longest_streak: updateResult.rows[0].longest_streak,
    message: newStreak > 1 ? "Streak continued!" : "Streak started!",
  };
}

async function passwordReset(userId, newPassword) {
  const query = `UPDATE users SET password_hash = $2 WHERE user_id = $1`;
  const result = await pool.query(query, [userId, newPassword]);
  return result.rowCount > 0;
}

async function deleteUser(userId) {
  const query = "DELETE FROM users WHERE user_id = $1";
  const result = await pool.query(query, [userId]);
  return result.rowCount > 0;
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
  saveEmotionAnalysis,
  updateStatusAndMood,
};
