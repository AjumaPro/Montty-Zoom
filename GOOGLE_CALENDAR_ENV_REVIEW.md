# Google Calendar .env Configuration Review

**Review Date**: 2024-11-06  
**Status**: ⚠️ **REDIRECT URI STILL INCORRECT**

## 🔴 Critical Issue Found

### Redirect URI Still Points to Wrong Service

**Current Configuration**:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com ✅
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret ✅
GOOGLE_REDIRECT_URI=https://connect.wpmailsmtp.com/google/ ❌ WRONG!
```

**Problem**: The redirect URI is still pointing to WordPress Mail SMTP, not Montty Zoom's callback endpoint.

## ✅ What's Correct

### Client Credentials ✅
- ✅ `GOOGLE_CLIENT_ID` - Valid format (ends with `.apps.googleusercontent.com`)
- ✅ `GOOGLE_CLIENT_SECRET` - Set (starts with `GOCSPX-`)
- ✅ Both credentials appear to be valid Google OAuth credentials

### Server Configuration ✅
- ✅ `PORT=5000` - Backend server port
- ✅ `FRONTEND_URL=http://localhost:3000` - Frontend URL

## 🔧 Required Fix

### Update Redirect URI

**Current (WRONG)**:
```env
GOOGLE_REDIRECT_URI=https://connect.wpmailsmtp.com/google/
```

**Should Be (Development)**:
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
```

**For Production** (when deploying):
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
```

## 📋 Complete Correct Configuration

### Development `.env`:
```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Production `.env` (when ready):
```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback

# Server Configuration
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

## ⚠️ Important: Update Google Cloud Console Too!

After fixing the `.env` file, you **MUST** also update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** > **Credentials**
3. Find OAuth Client ID: `your-client-id`
4. Click **Edit**
5. Under **Authorized redirect URIs**:
   - ✅ **Add**: `http://localhost:5000/api/calendar/google/callback`
   - ✅ **Add**: `https://yourdomain.com/api/calendar/google/callback` (for production)
   - ❌ **Remove**: `https://connect.wpmailsmtp.com/google/` (if not needed)
6. Click **Save**

## 🔍 Verification Steps

### 1. Check Current Redirect URI
```bash
grep GOOGLE_REDIRECT_URI .env
```

Should show:
```
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
```

### 2. Test Server Initialization
After updating `.env`, restart your server:
```bash
npm run server
```

Look for this log message:
```
info: Google Calendar OAuth client initialized { redirectUri: 'http://localhost:5000/api/calendar/google/callback' }
```

### 3. Test OAuth Flow
1. Navigate to Settings page in web app
2. Click "Connect Google Calendar"
3. Should redirect to Google OAuth page
4. After authorization, should redirect back to: `http://localhost:5000/api/calendar/google/callback`
5. Then redirect to: `http://localhost:3000/settings?calendar=connected`

## 🚨 Why This Matters

### Current Issue:
- ❌ Redirect URI points to WordPress SMTP service
- ❌ Google will reject OAuth callback (redirect_uri_mismatch error)
- ❌ Calendar integration won't work

### After Fix:
- ✅ Redirect URI matches backend callback route
- ✅ Google OAuth will work correctly
- ✅ Calendar integration will function properly

## 📊 Configuration Status

| Component | Status | Value |
|-----------|--------|-------|
| Client ID | ✅ Valid | `your-client-id.apps.googleusercontent.com` |
| Client Secret | ✅ Set | `GOCSPX-your-client-secret` |
| Redirect URI | ❌ **WRONG** | `https://connect.wpmailsmtp.com/google/` |
| Should Be | ⚠️ **FIX NEEDED** | `http://localhost:5000/api/calendar/google/callback` |
| Callback Route | ✅ Exists | `/api/calendar/google/callback` |

## 🎯 Action Required

### Immediate Steps:

1. **Update `.env` file**:
   ```env
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
   ```

2. **Update Google Cloud Console**:
   - Add redirect URI: `http://localhost:5000/api/calendar/google/callback`
   - Remove old WordPress SMTP URI (if not needed)

3. **Restart Server**:
   ```bash
   npm run server
   ```

4. **Verify**:
   - Check logs for correct redirect URI
   - Test OAuth flow

## ✅ Expected Result After Fix

When you restart the server, you should see:
```
info: Google Calendar OAuth client initialized { redirectUri: 'http://localhost:5000/api/calendar/google/callback' }
```

And the OAuth flow should work correctly!

---

**Summary**: Client ID and Secret are correct, but the redirect URI needs to be changed from WordPress SMTP URL to your backend callback URL.

