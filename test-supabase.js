/**
 * Supabase Connection Test Script
 * Run this to verify your Supabase setup is working correctly
 */

require('dotenv').config();
const { supabase } = require('./server/utils/supabase');
const logger = require('./server/utils/logger');

async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  
  // Check if Supabase client is initialized
  if (!supabase) {
    console.error('❌ Supabase client is not initialized!');
    console.log('\nPlease check:');
    console.log('1. Create a .env file in the project root');
    console.log('2. Add: SUPABASE_ANON_KEY=your_anon_key_here');
    console.log('3. Get your key from: https://app.supabase.com/project/ptjnlzrvqyynklzdipac/settings/api\n');
    process.exit(1);
  }

  console.log('✅ Supabase client initialized\n');

  // Test each table
  const tables = [
    'rooms',
    'scheduled_meetings',
    'meeting_history',
    'transcriptions',
    'users'
  ];

  console.log('📊 Testing tables...\n');
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Table '${table}' does NOT exist`);
          allTablesExist = false;
        } else {
          console.log(`⚠️  Error accessing '${table}': ${error.message}`);
          allTablesExist = false;
        }
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error testing '${table}': ${err.message}`);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allTablesExist) {
    console.log('\n✅ SUCCESS! All tables are configured correctly.');
    console.log('🚀 Your Supabase setup is ready to use!\n');
  } else {
    console.log('\n⚠️  Some tables are missing or inaccessible.');
    console.log('📝 Please run the SQL schema in Supabase SQL Editor:');
    console.log('   File: server/utils/supabase-schema.sql\n');
  }
  
  process.exit(allTablesExist ? 0 : 1);
}

testSupabaseConnection().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

