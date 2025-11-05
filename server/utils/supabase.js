/**
 * Supabase client configuration
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// Supabase project configuration
const SUPABASE_URL = process.env.SUPABASE_URL || `https://ptjnlzrvqyynklzdipac.supabase.co`;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// Create Supabase client
let supabase = null;

if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    });
    logger.info('Supabase client initialized', { url: SUPABASE_URL });
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
  }
} else {
  logger.warn('SUPABASE_ANON_KEY not configured. Please set it in your environment variables.');
  logger.info('To set up Supabase:');
  logger.info('1. Get your anon key from https://app.supabase.com/project/ptjnlzrvqyynklzdipac/settings/api');
  logger.info('2. Set SUPABASE_ANON_KEY in your .env file');
}

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};

