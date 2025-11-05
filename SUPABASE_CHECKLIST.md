# Supabase Configuration Checklist

## ✅ Step 1: Get Your Supabase API Key

1. Go to: https://app.supabase.com/project/ptjnlzrvqyynklzdipac/settings/api
2. Copy the **anon/public** key (not the service_role key)

## ✅ Step 2: Create .env File

Create a `.env` file in the project root with:

```env
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=paste_your_anon_key_here
```

## ✅ Step 3: Verify Tables Were Created

You mentioned you've created the tables. Verify they exist:
- `rooms`
- `scheduled_meetings`
- `meeting_history`
- `transcriptions`
- `users`

## ✅ Step 4: Test Connection

Run the test script:

```bash
npm run test:supabase
```

This will verify:
- ✅ Supabase client is initialized
- ✅ All tables exist and are accessible
- ✅ Connection is working properly

## ✅ Step 5: Start Server

Once verified, start your server:

```bash
npm run server
```

You should see:
```
info: Supabase client initialized
info: Supabase database connected successfully
info: Supabase tables verified
```

## Troubleshooting

### If test fails:
- **"Supabase client is not initialized"**: Check your `.env` file exists and has `SUPABASE_ANON_KEY` set
- **"Table does not exist"**: Run the SQL from `server/utils/supabase-schema.sql` in Supabase SQL Editor
- **"Invalid API key"**: Verify you're using the **anon/public** key, not service_role

### To check your tables in Supabase:
1. Go to: https://app.supabase.com/project/ptjnlzrvqyynklzdipac/editor
2. Check the Table Editor section
3. You should see all 5 tables listed

