-- Supabase Database Schema for Montty Zoom
-- Run this in Supabase SQL Editor or let the application create tables automatically

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(255) PRIMARY KEY,
  main_host VARCHAR(255),
  original_host VARCHAR(255),
  host_id VARCHAR(255),
  moderators TEXT[],
  participants JSONB DEFAULT '[]'::jsonb,
  waiting_room JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  is_recording BOOLEAN DEFAULT FALSE,
  is_streaming BOOLEAN DEFAULT FALSE,
  streaming_info JSONB,
  chat JSONB DEFAULT '[]'::jsonb,
  password VARCHAR(255),
  polls JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP,
  meeting_status VARCHAR(50) DEFAULT 'waiting',
  reactions JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP
);

-- Scheduled meetings table
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  scheduled_date VARCHAR(50),
  scheduled_time VARCHAR(50),
  scheduled_datetime TIMESTAMP,
  duration INTEGER,
  room_id VARCHAR(255),
  room_password VARCHAR(255),
  reminder_time INTEGER,
  participants JSONB DEFAULT '[]'::jsonb,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  recurrence_end_date VARCHAR(50),
  recurrence_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'scheduled'
);

-- Meeting history table
CREATE TABLE IF NOT EXISTS meeting_history (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  duration INTEGER,
  participants_count INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  room_id VARCHAR(255)
);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id VARCHAR(255) PRIMARY KEY,
  room_id VARCHAR(255),
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  transcript TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  last_signed_in TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_meeting_status ON rooms(meeting_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_datetime ON scheduled_meetings(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_status ON scheduled_meetings(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_room_id ON transcriptions(room_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_timestamp ON transcriptions(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_meeting_history_created_at ON meeting_history(created_at DESC);

-- Optional: Create function to auto-cleanup expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- Note: This requires enabling pg_cron extension in Supabase
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-expired-rooms', '0 * * * *', 'SELECT cleanup_expired_rooms()');

-- Comments for documentation
COMMENT ON TABLE rooms IS 'Stores active video conference rooms';
COMMENT ON TABLE scheduled_meetings IS 'Stores scheduled meetings';
COMMENT ON TABLE meeting_history IS 'Stores completed meeting history';
COMMENT ON TABLE transcriptions IS 'Stores meeting transcriptions';
COMMENT ON TABLE users IS 'Stores user information';

