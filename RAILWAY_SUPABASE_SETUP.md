# How to Set Supabase Environment Variables on Railway

## Step-by-Step Guide

### Step 1: Get Your Supabase API Keys

1. **Go to your Supabase Dashboard**:
   - Visit: https://app.supabase.com/project/ptjnlzrvqyynklzdipac
   - Or navigate to: **Settings** → **API**

2. **Copy the following values**:
   - **Project URL**: `https://ptjnlzrvqyynklzdipac.supabase.co`
   - **anon/public key**: This is your `SUPABASE_ANON_KEY`
   - **service_role key** (optional): This is your `SUPABASE_SERVICE_ROLE_KEY` (only if you need admin operations)

   **Important**: Use the **anon/public** key for `SUPABASE_ANON_KEY` (not the service_role key)

---

### Step 2: Access Railway Environment Variables

#### Option A: Via Railway Dashboard (Recommended)

1. **Log in to Railway**:
   - Go to https://railway.app
   - Sign in with your GitHub account

2. **Select your project**:
   - Click on your project name (or create a new project)

3. **Select your backend service**:
   - Click on the backend service (the one running `server/index.js`)

4. **Open Variables tab**:
   - Click on the **"Variables"** tab in the top menu
   - Or click **"Variables"** in the left sidebar

#### Option B: Via Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
railway variables set SUPABASE_ANON_KEY=your_anon_key_here
```

---

### Step 3: Add Environment Variables

In the Railway Variables tab, click **"+ New Variable"** and add each variable:

#### Required Variables:

1. **SUPABASE_URL**
   ```
   Name: SUPABASE_URL
   Value: https://ptjnlzrvqyynklzdipac.supabase.co
   ```

2. **SUPABASE_ANON_KEY**
   ```
   Name: SUPABASE_ANON_KEY
   Value: [paste your anon/public key from Supabase dashboard]
   ```

#### Optional Variables (if needed):

3. **SUPABASE_SERVICE_ROLE_KEY** (only if you need admin operations)
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [paste your service_role key from Supabase dashboard]
   ```

---

### Step 4: Add Other Required Environment Variables

While you're in the Variables tab, also add these:

#### Server Configuration:
```
NODE_ENV=production
PORT=5000
```

#### CORS & Frontend:
```
ALLOWED_ORIGINS=https://your-app.railway.app,https://your-frontend.railway.app
FRONTEND_URL=https://your-frontend.railway.app
```

**Note**: Replace `your-app.railway.app` and `your-frontend.railway.app` with your actual Railway URLs after deployment.

#### Optional (if using):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.railway.app/api/calendar/google/callback
```

---

### Step 5: Apply Changes

1. **After adding all variables**:
   - Railway automatically saves variables
   - Your service will automatically redeploy with the new variables

2. **Verify deployment**:
   - Check the **"Deployments"** tab to see the new deployment
   - Wait for it to complete (usually 1-2 minutes)

3. **Check logs**:
   - Go to the **"Logs"** tab
   - Look for: `info: Supabase client initialized`
   - You should see: `info: Supabase database connected successfully`

---

## Visual Guide (Railway Dashboard)

### Finding Variables Tab:
```
Railway Dashboard
├── Your Project
    ├── Backend Service
        ├── [Overview Tab]
        ├── [Variables Tab] ← Click here!
        ├── [Deployments Tab]
        ├── [Logs Tab]
        └── [Settings Tab]
```

### Adding a Variable:
1. Click **"+ New Variable"** button
2. Enter variable name (e.g., `SUPABASE_URL`)
3. Enter variable value (e.g., `https://ptjnlzrvqyynklzdipac.supabase.co`)
4. Click **"Add"** or press Enter
5. Variable is saved automatically

---

## Complete Environment Variables Checklist

Copy this checklist and verify all variables are set:

### ✅ Required for Supabase:
- [ ] `SUPABASE_URL` = `https://ptjnlzrvqyynklzdipac.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `[your anon key]`

### ✅ Required for Server:
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `ALLOWED_ORIGINS` = `[your frontend URLs]`
- [ ] `FRONTEND_URL` = `[your frontend URL]`

### ⚠️ Optional (if using features):
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `[if needed for admin]`
- [ ] `GOOGLE_CLIENT_ID` = `[if using Google Calendar]`
- [ ] `GOOGLE_CLIENT_SECRET` = `[if using Google Calendar]`
- [ ] `GOOGLE_REDIRECT_URI` = `[if using Google Calendar]`
- [ ] `REACT_APP_TURN_SERVERS` = `[if using WebRTC TURN servers]`

---

## Setting Variables for Frontend Service

If you're deploying frontend separately, you may also need to set:

### Frontend Service Variables:
```
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your anon key]
REACT_APP_TURN_SERVERS=[your TURN servers JSON]
```

**Note**: Frontend variables must start with `REACT_APP_` to be accessible in React code.

---

## Using Railway CLI (Alternative Method)

If you prefer command line:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
cd /path/to/your/project
railway link

# Set Supabase variables
railway variables set SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
railway variables set SUPABASE_ANON_KEY=your_anon_key_here

# Set other variables
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set ALLOWED_ORIGINS=https://your-app.railway.app
railway variables set FRONTEND_URL=https://your-frontend.railway.app

# View all variables
railway variables

# Deploy
railway up
```

---

## Using .env File (Local Development)

For local development, create a `.env` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Server Configuration
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**Important**: Never commit `.env` to Git! It's already in `.gitignore`.

---

## Verifying Variables Are Set

### Method 1: Check Railway Logs
1. Go to your backend service in Railway
2. Click **"Logs"** tab
3. Look for startup logs:
   ```
   info: Supabase client initialized { url: 'https://ptjnlzrvqyynklzdipac.supabase.co' }
   info: Supabase database connected successfully
   ```

### Method 2: Test API Endpoint
```bash
# Test health endpoint
curl https://your-backend.railway.app/api/health

# Should return JSON with status
```

### Method 3: Check Railway Variables Tab
- Go to Variables tab
- All your variables should be listed there
- Values are hidden (showing as `••••••`) for security

---

## Troubleshooting

### ❌ Error: "Supabase client is not initialized"
**Solution**: 
- Check `SUPABASE_ANON_KEY` is set correctly
- Verify the key is the **anon/public** key, not service_role
- Check for typos in variable names

### ❌ Error: "Invalid API key"
**Solution**:
- Go to Supabase dashboard → Settings → API
- Copy the **anon/public** key again
- Make sure there are no extra spaces when pasting

### ❌ Error: "Connection timeout"
**Solution**:
- Verify `SUPABASE_URL` is correct: `https://ptjnlzrvqyynklzdipac.supabase.co`
- Check your Supabase project is active
- Check Railway service logs for more details

### ❌ Variables not updating
**Solution**:
- Railway automatically redeploys when variables change
- Wait 1-2 minutes for redeployment
- Check Deployments tab to see if new deployment started
- If not, manually trigger redeploy from Deployments tab

### ❌ Frontend can't access backend
**Solution**:
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check `FRONTEND_URL` matches your frontend deployment URL
- Ensure CORS is configured correctly

---

## Security Best Practices

1. **Never commit secrets**:
   - ✅ Use Railway Variables (not code)
   - ✅ Use `.env` for local (already in `.gitignore`)
   - ❌ Never hardcode keys in code

2. **Use anon key for client-side**:
   - ✅ `SUPABASE_ANON_KEY` - Safe for frontend
   - ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - Backend only, never expose

3. **Rotate keys if exposed**:
   - If a key is accidentally committed, regenerate it in Supabase dashboard
   - Update Railway variables with new key

4. **Use different keys for environments**:
   - Development: Local `.env` file
   - Production: Railway Variables
   - Consider separate Supabase projects for dev/prod

---

## Quick Reference

### Get Supabase Keys:
- Dashboard: https://app.supabase.com/project/ptjnlzrvqyynklzdipac/settings/api
- Project URL: `https://ptjnlzrvqyynklzdipac.supabase.co`

### Railway Dashboard:
- Variables: https://railway.app → Your Project → Backend Service → Variables

### Required Variables:
```env
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=[from Supabase dashboard]
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=[your frontend URLs]
FRONTEND_URL=[your frontend URL]
```

---

## Next Steps

After setting variables:
1. ✅ Verify deployment succeeded
2. ✅ Check logs for "Supabase client initialized"
3. ✅ Test API endpoints
4. ✅ Test database operations
5. ✅ Deploy frontend (if separate)

Your Supabase connection should now be working on Railway! 🎉

