# Quick Supabase Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up (free account available)
3. Create a new project
4. Wait 2-3 minutes for provisioning

### Step 2: Get Connection String
1. In Supabase Dashboard: **Project Settings** > **Database**
2. Copy the **Connection string** (URI format)
3. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 3: Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env file
nano .env
```

Add your Supabase connection string:
```env
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with your actual database password.

To find your password:
- Go to **Project Settings** > **Database**
- If you forgot it, click **Reset Database Password**

### Step 4: Install Dependencies
```bash
npm install pg
```

### Step 5: Start Server
```bash
npm run server
```

You should see:
```
PostgreSQL database connected successfully
```

## ✅ Verification

Test the connection:
```bash
curl http://localhost:5000/api/health
```

Create a room and verify it persists:
1. Open http://localhost:3000
2. Create a room
3. Restart the server
4. Verify the room still exists (check database)

## 🔧 Connection Pooling (Recommended for Production)

For better performance, use Supabase's connection pooler:

Change port from `5432` to `6543`:
```env
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:6543/postgres?pgbouncer=true
```

## 📊 View Your Data

In Supabase Dashboard:
1. Go to **Table Editor**
2. You'll see tables: `rooms`, `scheduled_meetings`, `meeting_history`, etc.

## 🐛 Troubleshooting

**Connection refused?**
- Check connection string format
- Verify password is correct
- Ensure project is active

**SSL errors?**
- Use port 6543 (connection pooler) instead
- Or ensure SSL is enabled in connection string

**Tables not created?**
- Check server logs for errors
- Manually run SQL from `server/utils/supabase-schema.sql` in Supabase SQL Editor

## 📚 Full Documentation

See `SUPABASE_SETUP.md` for detailed instructions.

## 🎯 Next Steps

1. ✅ Configure Supabase
2. ✅ Test connection
3. ✅ Verify data persistence
4. ✅ Deploy to production

Your database is now configured! 🎉

