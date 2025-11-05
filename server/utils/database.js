/**
 * Database abstraction layer
 * Supports Supabase, PostgreSQL, MongoDB, and in-memory (development) storage
 */

const logger = require('./logger');
const { supabase } = require('./supabase');

class Database {
  constructor() {
    this.storage = new Map(); // In-memory fallback
    this.useDatabase = false;
    this.db = null;
    this.dbType = null; // 'supabase', 'postgresql', 'mongodb', or null
    this.initialize();
  }

  async initialize() {
    // Priority 1: Try Supabase first if configured
    if (supabase) {
      try {
        await this.initSupabase();
        return;
      } catch (error) {
        logger.error('Failed to initialize Supabase, trying other options:', error);
      }
    }

    // Priority 2: Check if database URL is configured (PostgreSQL or MongoDB)
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      logger.warn('No DATABASE_URL or SUPABASE configuration found. Using in-memory storage. Data will be lost on restart.');
      return;
    }

    try {
      // Detect database type from URL
      if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        await this.initPostgreSQL(dbUrl);
      } else if (dbUrl.startsWith('mongodb://')) {
        await this.initMongoDB(dbUrl);
      } else {
        logger.warn(`Unknown database type in DATABASE_URL. Using in-memory storage.`);
      }
    } catch (error) {
      logger.error('Failed to initialize database, falling back to in-memory storage:', error);
      this.useDatabase = false;
    }
  }

  async initSupabase() {
    try {
      // Test connection
      const { data, error } = await supabase.from('rooms').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (OK for first run)
        throw error;
      }

      this.db = supabase;
      this.dbType = 'supabase';
      this.useDatabase = true;
      
      // Create tables if they don't exist
      await this.createSupabaseTables();
      
      logger.info('Supabase database connected successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase:', error);
      throw error;
    }
  }

  async initPostgreSQL(dbUrl) {
    try {
      // Try to require pg module
      const { Pool } = require('pg');
      this.db = new Pool({ connectionString: dbUrl });
      this.dbType = 'postgresql';
      
      // Test connection
      await this.db.query('SELECT NOW()');
      this.useDatabase = true;
      
      // Create tables if they don't exist
      await this.createPostgreSQLTables();
      
      logger.info('PostgreSQL database connected successfully');
    } catch (error) {
      // pg module not installed
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('PostgreSQL driver (pg) not installed. Install with: npm install pg');
        logger.warn('Falling back to in-memory storage.');
      } else {
        throw error;
      }
    }
  }

  async initMongoDB(dbUrl) {
    try {
      // Try to require mongodb module
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(dbUrl);
      await client.connect();
      this.db = client.db();
      this.dbType = 'mongodb';
      this.useDatabase = true;
      
      logger.info('MongoDB database connected successfully');
    } catch (error) {
      // mongodb module not installed
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('MongoDB driver (mongodb) not installed. Install with: npm install mongodb');
        logger.warn('Falling back to in-memory storage.');
      } else {
        throw error;
      }
    }
  }

  async createSupabaseTables() {
    if (!this.useDatabase || !this.db) return;
    
    // Note: Supabase tables should be created via SQL Editor in Supabase dashboard
    // This method verifies tables exist and logs any missing tables
    const tables = ['rooms', 'scheduled_meetings', 'meeting_history', 'transcriptions', 'users'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error && error.code === 'PGRST116') {
          logger.warn(`Table '${table}' does not exist in Supabase. Please run the SQL schema in Supabase SQL Editor.`);
        }
      } catch (error) {
        logger.warn(`Could not verify table '${table}':`, error.message);
      }
    }
    
    logger.info('Supabase tables verified. Run supabase-schema.sql in Supabase SQL Editor if tables are missing.');
  }

  async createPostgreSQLTables() {
    if (!this.useDatabase || !this.db) return;

    const queries = [
      // Rooms table
      `CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        main_host VARCHAR(255),
        original_host VARCHAR(255),
        host_id VARCHAR(255),
        moderators TEXT[],
        participants JSONB,
        waiting_room JSONB,
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
      )`,
      // Scheduled meetings table
      `CREATE TABLE IF NOT EXISTS scheduled_meetings (
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
      )`,
      // Meeting history table
      `CREATE TABLE IF NOT EXISTS meeting_history (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        duration INTEGER,
        participants_count INTEGER,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        room_id VARCHAR(255)
      )`,
      // Transcriptions table
      `CREATE TABLE IF NOT EXISTS transcriptions (
        id VARCHAR(255) PRIMARY KEY,
        room_id VARCHAR(255),
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        transcript TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        last_signed_in TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // Pricing plans table
      `CREATE TABLE IF NOT EXISTS pricing_plans (
        plan_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        billing VARCHAR(50) DEFAULT 'monthly',
        description TEXT,
        features JSONB DEFAULT '[]'::jsonb,
        limitations JSONB DEFAULT '{}'::jsonb,
        call_minutes INTEGER NOT NULL,
        popular BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // User subscriptions table
      `CREATE TABLE IF NOT EXISTS user_subscriptions (
        user_id VARCHAR(255) PRIMARY KEY,
        plan_id VARCHAR(50),
        plan_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        billing_cycle VARCHAR(50) DEFAULT 'monthly',
        call_minutes INTEGER,
        call_minutes_used INTEGER DEFAULT 0,
        call_minutes_remaining INTEGER,
        max_participants INTEGER,
        features JSONB DEFAULT '{}'::jsonb,
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Activity logs table
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(255),
        details JSONB DEFAULT '{}'::jsonb,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // Payment transactions table
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        subscription_id VARCHAR(255),
        transaction_id VARCHAR(255) UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50),
        stripe_payment_id VARCHAR(255),
        plan_id VARCHAR(50),
        billing_cycle VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Email templates table
      `CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Content management table
      `CREATE TABLE IF NOT EXISTS content_items (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE,
        published BOOLEAN DEFAULT FALSE,
        author VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Feature flags table
      `CREATE TABLE IF NOT EXISTS feature_flags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        enabled BOOLEAN DEFAULT FALSE,
        target_users JSONB DEFAULT '[]'::jsonb,
        target_percentage INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // API keys table
      `CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(255),
        rate_limit INTEGER DEFAULT 1000,
        permissions JSONB DEFAULT '{}'::jsonb,
        active BOOLEAN DEFAULT TRUE,
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )`,
      // Support tickets table
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )`,
      // Ticket messages table
      `CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // System settings table
      `CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        category VARCHAR(50),
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Backup records table
      `CREATE TABLE IF NOT EXISTS backup_records (
        id SERIAL PRIMARY KEY,
        backup_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500),
        file_size BIGINT,
        status VARCHAR(50) DEFAULT 'pending',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )`,
      // Admin roles table
      `CREATE TABLE IF NOT EXISTS admin_roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL UNIQUE,
        permissions JSONB DEFAULT '{}'::jsonb,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // User roles mapping table
      `CREATE TABLE IF NOT EXISTS user_admin_roles (
        user_id VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES admin_roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        assigned_by VARCHAR(255),
        PRIMARY KEY (user_id, role_id)
      )`,
      // Customer service calls table
      `CREATE TABLE IF NOT EXISTS customer_service_calls (
        id SERIAL PRIMARY KEY,
        call_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        agent_id VARCHAR(255),
        agent_name VARCHAR(255),
        call_type VARCHAR(50) DEFAULT 'inbound',
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        subject VARCHAR(255),
        description TEXT,
        duration INTEGER DEFAULT 0,
        resolution TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        resolved_at TIMESTAMP
      )`,
      // Customer experience metrics table
      `CREATE TABLE IF NOT EXISTS customer_experience (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        call_id VARCHAR(255),
        interaction_type VARCHAR(50),
        satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
        nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
        csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
        feedback TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        agent_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // Call center agents table
      `CREATE TABLE IF NOT EXISTS call_center_agents (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        total_calls INTEGER DEFAULT 0,
        avg_rating DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_datetime ON scheduled_meetings(scheduled_datetime)`,
      `CREATE INDEX IF NOT EXISTS idx_transcriptions_room_id ON transcriptions(room_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    ];

    for (const query of queries) {
      await this.db.query(query);
    }
  }

  // Room operations
  async getRoom(roomId) {
    if (!this.useDatabase) {
      return this.storage.get(`room:${roomId}`);
    }

    if (this.dbType === 'supabase') {
      // Supabase
      const { data, error } = await this.db.from('rooms').select('*').eq('id', roomId).single();
      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching room from Supabase:', error);
      }
      return data || null;
    } else if (this.db.constructor.name === 'Pool') {
      // PostgreSQL
      const result = await this.db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
      return result.rows[0] || null;
    } else {
      // MongoDB
      return await this.db.collection('rooms').findOne({ id: roomId });
    }
  }

  async saveRoom(room) {
    if (!this.useDatabase) {
      this.storage.set(`room:${room.id}`, room);
      return;
    }

    if (this.dbType === 'supabase') {
      // Supabase - prepare data for upsert
      const roomData = {
        id: room.id,
        main_host: room.mainHost,
        original_host: room.originalHost,
        host_id: room.hostId,
        moderators: room.moderators || [],
        participants: room.participants || [],
        waiting_room: room.waitingRoom || [],
        created_at: room.createdAt || new Date().toISOString(),
        is_recording: room.isRecording || false,
        is_streaming: room.isStreaming || false,
        streaming_info: room.streamingInfo || null,
        chat: room.chat || [],
        password: room.password || null,
        polls: room.polls || [],
        files: room.files || [],
        started_at: room.startedAt || null,
        meeting_status: room.meetingStatus || 'waiting',
        reactions: room.reactions || [],
        expires_at: room.expiresAt || null
      };
      
      const { error } = await this.db.from('rooms').upsert(roomData, { onConflict: 'id' });
      if (error) {
        logger.error('Error saving room to Supabase:', error);
        throw error;
      }
    } else if (this.db.constructor.name === 'Pool') {
      // PostgreSQL
      await this.db.query(
        `INSERT INTO rooms (id, main_host, original_host, host_id, moderators, participants, waiting_room, 
         created_at, is_recording, is_streaming, streaming_info, chat, password, polls, files, 
         started_at, meeting_status, reactions, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET
         main_host = EXCLUDED.main_host,
         moderators = EXCLUDED.moderators,
         participants = EXCLUDED.participants,
         waiting_room = EXCLUDED.waiting_room,
         is_recording = EXCLUDED.is_recording,
         is_streaming = EXCLUDED.is_streaming,
         streaming_info = EXCLUDED.streaming_info,
         chat = EXCLUDED.chat,
         polls = EXCLUDED.polls,
         files = EXCLUDED.files,
         started_at = EXCLUDED.started_at,
         meeting_status = EXCLUDED.meeting_status,
         reactions = EXCLUDED.reactions`,
        [
          room.id, room.mainHost, room.originalHost, room.hostId,
          room.moderators || [], JSON.stringify(room.participants || []),
          JSON.stringify(room.waitingRoom || []), room.createdAt || new Date(),
          room.isRecording || false, room.isStreaming || false,
          JSON.stringify(room.streamingInfo || null),
          JSON.stringify(room.chat || []), room.password,
          JSON.stringify(room.polls || []), JSON.stringify(room.files || []),
          room.startedAt, room.meetingStatus || 'waiting',
          JSON.stringify(room.reactions || []), room.expiresAt
        ]
      );
    } else {
      // MongoDB
      await this.db.collection('rooms').replaceOne(
        { id: room.id },
        room,
        { upsert: true }
      );
    }
  }

  async deleteRoom(roomId) {
    if (!this.useDatabase) {
      this.storage.delete(`room:${roomId}`);
      return;
    }

    if (this.dbType === 'supabase') {
      const { error } = await this.db.from('rooms').delete().eq('id', roomId);
      if (error) {
        logger.error('Error deleting room from Supabase:', error);
      }
    } else if (this.db.constructor.name === 'Pool') {
      await this.db.query('DELETE FROM rooms WHERE id = $1', [roomId]);
    } else {
      await this.db.collection('rooms').deleteOne({ id: roomId });
    }
  }

  async getAllRooms() {
    if (!this.useDatabase) {
      const rooms = [];
      for (const [key, value] of this.storage.entries()) {
        if (key.startsWith('room:')) {
          rooms.push(value);
        }
      }
      return rooms;
    }

    if (this.dbType === 'supabase') {
      const { data, error } = await this.db.from('rooms').select('*');
      if (error) {
        logger.error('Error fetching all rooms from Supabase:', error);
        return [];
      }
      return data || [];
    } else if (this.db.constructor.name === 'Pool') {
      const result = await this.db.query('SELECT * FROM rooms');
      return result.rows;
    } else {
      return await this.db.collection('rooms').find({}).toArray();
    }
  }

  // Scheduled meetings operations
  async getScheduledMeeting(meetingId) {
    if (!this.useDatabase) {
      return this.storage.get(`meeting:${meetingId}`);
    }

    if (this.dbType === 'supabase') {
      const { data, error } = await this.db.from('scheduled_meetings').select('*').eq('id', meetingId).single();
      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching scheduled meeting from Supabase:', error);
      }
      return data || null;
    } else if (this.db.constructor.name === 'Pool') {
      const result = await this.db.query('SELECT * FROM scheduled_meetings WHERE id = $1', [meetingId]);
      return result.rows[0] || null;
    } else {
      return await this.db.collection('scheduled_meetings').findOne({ id: meetingId });
    }
  }

  async saveScheduledMeeting(meeting) {
    if (!this.useDatabase) {
      this.storage.set(`meeting:${meeting.id}`, meeting);
      return;
    }

    if (this.dbType === 'supabase') {
      const meetingData = {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        scheduled_date: meeting.scheduledDate,
        scheduled_time: meeting.scheduledTime,
        scheduled_datetime: meeting.scheduledDateTime,
        duration: meeting.duration,
        room_id: meeting.roomId,
        room_password: meeting.roomPassword,
        reminder_time: meeting.reminderTime,
        participants: meeting.participants || [],
        is_recurring: meeting.isRecurring || false,
        recurrence_pattern: meeting.recurrencePattern,
        recurrence_end_date: meeting.recurrenceEndDate,
        recurrence_count: meeting.recurrenceCount,
        created_at: meeting.createdAt || new Date().toISOString(),
        status: meeting.status || 'scheduled'
      };
      
      const { error } = await this.db.from('scheduled_meetings').upsert(meetingData, { onConflict: 'id' });
      if (error) {
        logger.error('Error saving scheduled meeting to Supabase:', error);
        throw error;
      }
    } else if (this.db.constructor.name === 'Pool') {
      await this.db.query(
        `INSERT INTO scheduled_meetings (id, title, description, scheduled_date, scheduled_time, 
         scheduled_datetime, duration, room_id, room_password, reminder_time, participants, 
         is_recurring, recurrence_pattern, recurrence_end_date, recurrence_count, created_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         scheduled_date = EXCLUDED.scheduled_date,
         scheduled_time = EXCLUDED.scheduled_time,
         scheduled_datetime = EXCLUDED.scheduled_datetime,
         duration = EXCLUDED.duration,
         reminder_time = EXCLUDED.reminder_time,
         participants = EXCLUDED.participants,
         is_recurring = EXCLUDED.is_recurring,
         recurrence_pattern = EXCLUDED.recurrence_pattern,
         recurrence_end_date = EXCLUDED.recurrence_end_date,
         recurrence_count = EXCLUDED.recurrence_count,
         status = EXCLUDED.status`,
        [
          meeting.id, meeting.title, meeting.description, meeting.scheduledDate,
          meeting.scheduledTime, meeting.scheduledDateTime, meeting.duration,
          meeting.roomId, meeting.roomPassword, meeting.reminderTime,
          JSON.stringify(meeting.participants || []), meeting.isRecurring || false,
          meeting.recurrencePattern, meeting.recurrenceEndDate, meeting.recurrenceCount,
          meeting.createdAt || new Date(), meeting.status || 'scheduled'
        ]
      );
    } else {
      await this.db.collection('scheduled_meetings').replaceOne(
        { id: meeting.id },
        meeting,
        { upsert: true }
      );
    }
  }

  async deleteScheduledMeeting(meetingId) {
    if (!this.useDatabase) {
      this.storage.delete(`meeting:${meetingId}`);
      return;
    }

    if (this.dbType === 'supabase') {
      const { error } = await this.db.from('scheduled_meetings').delete().eq('id', meetingId);
      if (error) {
        logger.error('Error deleting scheduled meeting from Supabase:', error);
      }
    } else if (this.db.constructor.name === 'Pool') {
      await this.db.query('DELETE FROM scheduled_meetings WHERE id = $1', [meetingId]);
    } else {
      await this.db.collection('scheduled_meetings').deleteOne({ id: meetingId });
    }
  }

  async getAllScheduledMeetings() {
    if (!this.useDatabase) {
      const meetings = [];
      for (const [key, value] of this.storage.entries()) {
        if (key.startsWith('meeting:')) {
          meetings.push(value);
        }
      }
      return meetings;
    }

    if (this.dbType === 'supabase') {
      const { data, error } = await this.db.from('scheduled_meetings').select('*').order('scheduled_datetime', { ascending: true });
      if (error) {
        logger.error('Error fetching scheduled meetings from Supabase:', error);
        return [];
      }
      return data || [];
    } else if (this.db.constructor.name === 'Pool') {
      const result = await this.db.query('SELECT * FROM scheduled_meetings ORDER BY scheduled_datetime ASC');
      return result.rows;
    } else {
      return await this.db.collection('scheduled_meetings').find({}).sort({ scheduledDateTime: 1 }).toArray();
    }
  }

  // Cleanup expired rooms
  async cleanupExpiredRooms() {
    if (!this.useDatabase) {
      const now = new Date();
      for (const [key, room] of this.storage.entries()) {
        if (key.startsWith('room:') && room.expiresAt && new Date(room.expiresAt) < now) {
          this.storage.delete(key);
        }
      }
      return;
    }

    const now = new Date().toISOString();
    if (this.dbType === 'supabase') {
      const { error } = await this.db.from('rooms').delete().lt('expires_at', now);
      if (error) {
        logger.error('Error cleaning up expired rooms from Supabase:', error);
      }
    } else if (this.db.constructor.name === 'Pool') {
      await this.db.query('DELETE FROM rooms WHERE expires_at < $1', [now]);
    } else {
      await this.db.collection('rooms').deleteMany({ expiresAt: { $lt: now } });
    }
  }
}

// Export singleton instance
const db = new Database();

module.exports = db;

