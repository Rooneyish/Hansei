const pool = require("./db");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const { encrypt } = require("../utils/crypto");

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
        SELECT 
            u.user_id, u.username, u.email, 
            p.streak_count, p.longest_streak, p.current_mood,
            p.total_gold, p.daily_journal, p.daily_cbt, p.daily_zen -- <--- ADD THESE
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

async function findActiveChatSession(userId) {
  const query = `SELECT session_id from chat_sessions WHERE user_id = $1 AND end_time IS NULL LIMIT 1`;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error finding active session", err.stack);
    throw err;
  }
}

async function startNewChatSession(userId) {
  const query = `
    INSERT INTO chat_sessions (user_id, start_time, title) 
    VALUES ($1, NOW(), $2) 
    RETURNING session_id
  `;
  try {
    const result = await pool.query(query, [userId, "New Reflection"]);
    return result.rows[0];
  } catch (err) {
    console.error("Error starting new chat session", err.stack);
    throw err;
  }
}

async function saveChatMessage(sessionId, role, encryptedText) {
  const query = `
    INSERT INTO chat_messages (session_id, role, encrypted_text) 
    VALUES ($1, $2, $3) 
    RETURNING message_id, created_at
  `;
  try {
    const result = await pool.query(query, [sessionId, role, encryptedText]);
    return result.rows[0];
  } catch (err) {
    console.error("Error saving chat message", err.stack);
    throw err;
  }
}

async function endChatSession(sessionId) {
  const query = `
    UPDATE chat_sessions 
    SET end_time = NOW() 
    WHERE session_id = $1 
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error ending chat session", err.stack);
    throw err;
  }
}

async function getMessagesBySessionId(sessionId) {
  const query = `
    SELECT role, encrypted_text, created_at 
    FROM chat_messages 
    WHERE session_id = $1 
    ORDER BY created_at ASC
  `;
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (err) {
    console.error("Error fetching session history", err.stack);
    throw err;
  }
}

async function getAllUserSessions(userId) {
  const query = `
    SELECT 
      s.session_id, 
      s.title, 
      s.start_time, 
      (
        SELECT encrypted_text 
        FROM chat_messages 
        WHERE session_id = s.session_id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) AS preview_text
    FROM chat_sessions s
    WHERE s.user_id = $1
    ORDER BY s.start_time DESC; 
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function deleteSession(session_id, user_id) {
  const query = `DELETE FROM chat_sessions WHERE session_id = $1 AND user_id = $2`;
  try {
    const result = await pool.query(query, [session_id, user_id]);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error while deleting session.", err.stack);
    throw err;
  }
}

async function getAllMusic() {
  const query = "SELECT * FROM music_tracks";
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error("Cannot find music tracks");
    throw err;
  }
}

async function getTrackById(id) {
  const query = "SELECT * FROM music_tracks WHERE id = $1";
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (err) {
    console.log("Cannot find music track with id: ", err.message);
  }
}

async function saveCBTResult(userId, journalId, distortion, thought, reframe) {
  const query = `
    INSERT INTO cbt_lab_results (user_id, journal_id, distortion_type, original_thought, reframed_thought)
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const result = await pool.query(query, [
    userId,
    journalId,
    distortion,
    thought,
    reframe,
  ]);
  return result.rows[0];
}

async function getCBTHistory(userId) {
  const query = `
    SELECT * FROM cbt_lab_results 
    WHERE user_id = $1 
    ORDER BY created_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function createProactiveSession(
  userId,
  distortionType,
  initialAiMessage,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sessionQuery = `
      INSERT INTO chat_sessions (user_id, title) 
      VALUES ($1, $2) RETURNING session_id;
    `;
    const sessionResult = await client.query(sessionQuery, [
      userId,
      `Reframing: ${distortionType}`,
    ]);
    const sessionId = sessionResult.rows[0].session_id;

    const encryptedAiMsg = encrypt(initialAiMessage, KEY);

    const messageQuery = `
      INSERT INTO chat_messages (session_id, role, encrypted_text) 
      VALUES ($1, $2, $3);
    `;
    await client.query(messageQuery, [sessionId, "ai", encryptedAiMsg]);

    await client.query("COMMIT");
    return sessionId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function createMeditationEntry(userId, type, duration, moodReflection) {
  const query = `
  INSERT INTO meditation_sessions (user_id, session_type, duration_seconds, mood_post_reflection) 
             VALUES ($1, $2, $3, $4) RETURNING *
  `;

  const values = [userId, type, duration, moodReflection];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error("Database Error in saveMeditationSession:", err.stack);
    throw err;
  }
}

const getLatestJournal = async (userId) => {
  const res = await pool.query(
    `SELECT j.encrypted_journal_content AS text, e.primary_emotion 
FROM journal_entries j
LEFT JOIN emotion_analysis e ON j.journal_id = e.journal_id
WHERE j.user_id = $1
ORDER BY j.created_at DESC LIMIT 1;`,
    [userId],
  );
  return res.rows[0];
};

async function updateDailyRitual(userId, pillarType) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pillarKey = `daily_${pillarType}`;

    const updateRes = await client.query(
      `
      UPDATE user_progress 
      SET 
        daily_journal = CASE WHEN last_reset_date < CURRENT_DATE THEN FALSE ELSE daily_journal END,
        daily_cbt = CASE WHEN last_reset_date < CURRENT_DATE THEN FALSE ELSE daily_cbt END,
        daily_zen = CASE WHEN last_reset_date < CURRENT_DATE THEN FALSE ELSE daily_zen END,
        last_reset_date = CURRENT_DATE
      WHERE user_id = $1
      RETURNING daily_journal, daily_cbt, daily_zen
    `,
      [userId],
    );

    const statusBeforeUpdate = updateRes.rows[0];
    const alreadyDone = statusBeforeUpdate[pillarKey];

    let goldEarned = 0;
    let masterBonus = 0;

    if (!alreadyDone) {
      goldEarned = 50;

      await client.query(
        `UPDATE user_progress SET ${pillarKey} = TRUE, total_gold = total_gold + $1 
         WHERE user_id = $2`,
        [goldEarned, userId],
      );

      const finalCheck = await client.query(
        `SELECT daily_journal, daily_cbt, daily_zen FROM user_progress WHERE user_id = $1`,
        [userId],
      );

      const s = finalCheck.rows[0];
      if (s.daily_journal && s.daily_cbt && s.daily_zen) {
        masterBonus = 100;
        await client.query(
          `UPDATE user_progress SET total_gold = total_gold + $1 WHERE user_id = $2`,
          [masterBonus, userId],
        );
      }
    }

    await client.query("COMMIT");
    return { goldEarned, masterBonus, isNewPillar: !alreadyDone };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Daily Ritual Error:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function saveCBTResult(userId, journalId, distortion, thought, reframe) {
  const query = `
    INSERT INTO cbt_lab_results (user_id, journal_id, distortion_type, original_thought, reframed_thought)
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *;
  `;
  const values = [userId, journalId || null, distortion, thought, reframe];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function saveBulkSession(userId, trackIds, duration, startAt, endAt) {
  const query = `
            INSERT INTO music_sessions (user_id, track_ids, total_minutes, start_at, end_at)
            VALUES ($1, $2, $3, $4, $5)
        `;
  const values = [userId, trackIds, duration, startAt, endAt];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function getActivityHistory(userId) {
  const query = `
    SELECT 
      'journal' as type, 
      journal_id::text as id, 
      'Daily Reflection' as title, 
      'Personal journal entry saved' as detail,
      created_at 
    FROM journal_entries 
    WHERE user_id = $1

    UNION ALL

    SELECT 
      'zen' as type, 
      id::text as id, 
      'Zen: ' || session_type as title, 
      (duration_seconds / 60) || ' min session completed' as detail,
      created_at 
    FROM meditation_sessions 
    WHERE user_id = $1

    UNION ALL

    SELECT 
      'cbt' as type, 
      id::text as id, 
      'Reframe: ' || distortion_type as title, 
      'Cognitive distortion repaired' as detail,
      created_at 
    FROM cbt_lab_results 
    WHERE user_id = $1

    UNION ALL

    SELECT 
      'music' as type, 
      session_id::text as id, 
      'Mindful Music' as title, 
      COALESCE(total_minutes, 0) || ' min listening session' as detail,
      start_at as created_at 
    FROM music_sessions 
    WHERE user_id = $1

    ORDER BY created_at DESC;
  `;

  const res = await pool.query(query, [userId]);
  return res.rows;
}

async function deleteActivity(userId, type, id) {
  let tableName = "";
  let idColumn = "id";

  switch (type) {
    case "journal":
      tableName = "journal_entries";
      idColumn = "journal_id";
      break;
    case "zen":
      tableName = "meditation_sessions";
      break;
    case "cbt":
      tableName = "cbt_lab_results";
      break;
    case "music":
      tableName = "music_sessions";
      idColumn = "session_id";
      break;
    default:
      throw new Error("Invalid activity type");
  }

  const query = `DELETE FROM ${tableName} WHERE user_id = $1 AND ${idColumn} = $2`;
  const res = await pool.query(query, [userId, id]);
  return res.rowCount > 0;
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
  findActiveChatSession,
  startNewChatSession,
  getMessagesBySessionId,
  endChatSession,
  saveChatMessage,
  getAllUserSessions,
  deleteSession,
  getAllMusic,
  getTrackById,
  saveCBTResult,
  getCBTHistory,
  createProactiveSession,
  createMeditationEntry,
  getLatestJournal,
  updateDailyRitual,
  saveBulkSession,
  getActivityHistory,
  deleteActivity
};
