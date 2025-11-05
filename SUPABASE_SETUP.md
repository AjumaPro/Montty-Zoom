# Supabase Setup Instructions for Montty Zoom

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Your Supabase project ID: `ptjnlzrvqyynklzdipac`

## Step 1: Get Your Supabase API Keys

1. Go to your Supabase project dashboard: https://app.supabase.com/project/ptjnlzrvqyynklzdipac
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL**: `https://ptjnlzrvqyynklzdipac.supabase.co`
   - **anon/public key**: This is your `SUPABASE_ANON_KEY`

## Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `server/utils/supabase-schema.sql`
3. Paste and run the SQL script in the SQL Editor
4. This will create all necessary tables:
   - `rooms`
   - `scheduled_meetings`
   - `meeting_history`
   - `transcriptions`
   - `users`

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

## Step 4: Verify Connection

1. Start the server:
   ```bash
   npm run server
   ```

2. Check the logs - you should see:
   ```
   info: Supabase client initialized
   info: Supabase database connected successfully
   ```

## Troubleshooting

### Error: "Table does not exist"
- Make sure you've run the SQL schema in Supabase SQL Editor
- Check that tables were created in **Table Editor** section

### Error: "Invalid API key"
- Verify your `SUPABASE_ANON_KEY` is correct
- Ensure you're using the **anon/public** key, not the service_role key

### Error: "Connection timeout"
- Check your Supabase project is active
- Verify the project URL is correct

## Database Schema Location

The SQL schema file is located at:
- `server/utils/supabase-schema.sql`

## Additional Notes

- Supabase provides automatic backups and scaling
- Data is persisted across server restarts
- The application will automatically fall back to in-memory storage if Supabase is not configured
