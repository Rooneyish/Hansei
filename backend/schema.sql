-- -- Hansei Database Schema

-- -- 1. Users Table (Core profile)
-- CREATE TABLE IF NOT EXISTS users (
--     user_id SERIAL PRIMARY KEY,
--     username VARCHAR(50) UNIQUE NOT NULL,
--     email VARCHAR(100) UNIQUE NOT NULL,
--     age INT,
--     password_hash TEXT NOT NULL,
--     role VARCHAR(20) DEFAULT 'user',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- 2. User Progress (Gamification & Streaks - Req FR6)
-- CREATE TABLE IF NOT EXISTS user_progress (
--     progress_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
--     streak_count INT DEFAULT 0,
--     longest_streak INT DEFAULT 0,
--     total_quests INT DEFAULT 0,
--     last_activity DATE DEFAULT CURRENT_DATE,
--     UNIQUE(user_id)
-- );

-- -- 3. Journal Entries (Journaling with NLP - Req FR2)
-- CREATE TABLE IF NOT EXISTS journal_entries (
--     journal_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
--     encrypted_journal_content TEXT NOT NULL,
--     is_safe BOOLEAN DEFAULT true,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- 4. Emotion Analysis (AI Logic - Req FR2)
-- CREATE TABLE IF NOT EXISTS emotion_analysis (
--     analysis_id SERIAL PRIMARY KEY,
--     journal_id INT REFERENCES journal_entries(journal_id) ON DELETE CASCADE,
--     primary_emotion VARCHAR(50),
--     confidence_score DECIMAL(5, 2),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- 5. Safety Logs (Crisis Detection - Req FR5)
-- CREATE TABLE IF NOT EXISTS safety_logs (
--     log_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
--     risk_level VARCHAR(20), -- low, medium, high
--     triggered_keyword TEXT,
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Connect to your db if not already connected: \c hansei_db

-- 6. Chat Sessions (Groups messages into one "conversation")
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP
);

-- 7. Chat Messages (The actual dialogue)
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(20), -- 'user' or 'ai'
    encrypted_text TEXT NOT NULL, -- Requirement NFR1: Encryption
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);