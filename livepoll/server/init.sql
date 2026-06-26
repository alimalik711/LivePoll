-- This script will set up our initial tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    presenter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    join_code CHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, ended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive', -- 'inactive', 'open', 'closed'
    position INTEGER DEFAULT 1, -- To keep questions in order (Q1, Q2, Q3)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Options Table (The choices for each question)
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL
);

-- 5. Votes Table (The most important table for logic)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES options(id) ON DELETE CASCADE,
    voter_token VARCHAR(255) NOT NULL, -- The unique ID from the user's browser
    voter_name VARCHAR(255),            -- Saved participant nickname
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- THE GUARD: This prevents the same token from voting on the same question twice
    UNIQUE(question_id, voter_token) 
);