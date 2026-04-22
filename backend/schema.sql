CREATE DATABASE hansei_db;

CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INTEGER,
    password_hash TEXT NOT NULL,
    role VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.journal_entries (
    journal_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    encrypted_journal_content TEXT NOT NULL,
    is_safe BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.emotion_analysis (
    analysis_id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL REFERENCES public.journal_entries(journal_id),
    primary_emotion VARCHAR(50),
    confidence_score NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.cbt_lab_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    journal_id INTEGER NOT NULL REFERENCES public.journal_entries(journal_id),
    distortion_type VARCHAR(255),
    original_thought TEXT,
    reframed_thought TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.user_progress (
    progress_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(user_id),
    streak_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_quests INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    current_mood VARCHAR(50),
    total_gold INTEGER DEFAULT 0,
    daily_journal BOOLEAN DEFAULT FALSE,
    daily_cbt BOOLEAN DEFAULT FALSE,
    daily_zen BOOLEAN DEFAULT FALSE,
    last_reset_date DATE,
    in_crisis BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.chat_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    title VARCHAR(255)
);

CREATE TABLE public.chat_messages (
    message_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.chat_sessions(session_id),
    role VARCHAR(20), 
    encrypted_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.safety_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    risk_level VARCHAR(20),
    triggered_keyword TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.crisis_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    trigger_source VARCHAR(50)
);

CREATE TABLE public.meditation_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    session_type VARCHAR(50),
    duration_seconds INTEGER,
    mood_post_reflection TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.music_tracks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    music_file TEXT NOT NULL,
    artwork_file TEXT,
    duration INTEGER,
    category VARCHAR(50),
    description TEXT,
    mood_tags TEXT[], 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.music_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP,
    track_ids INTEGER[], 
    total_minutes INTEGER
);