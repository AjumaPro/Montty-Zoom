# Google Calendar Integration Configuration Review

**Review Date**: 2024-11-06  
**Status**: ⚠️ **REDIRECT URI MISMATCH DETECTED**

## 🔴 Critical Issue Found

### Redirect URI Configuration Problem

**Current Configuration**:
```
GOOGLE_REDIRECT_URI=https://connect.wpmailsmtp.com/google/
```

**Issue**: This redirect URI appears to be for WordPress Mail SMTP plugin, not for Montty Zoom application.

**Actual Callback Route**: `/api/calendar/google/callback` (defined in `server/index.js` line 726)

## ✅ What's Configured Correctly

### Environment Variables Present ✅
- ✅ `GOOGLE_CLIENT_ID` - Set
- ✅ `GOOGLE_CLIENT_SECRET` - Set  
- ✅ `GOOGLE_REDIRECT_URI` - Set (but incorrect value)
- ✅ `FRONTEND_URL` - Set to `http://localhost:3000`

### Code Implementation ✅
- ✅ Google OAuth client initialization in `server/index.js` (line 687-694)
- ✅ Callback route handler exists: `/api/calendar/google/callback` (line 726)
- ✅ Calendar service properly implemented in `server/utils/calendarService.js`
- ✅ Proper error handling and logging

## 🔧 Required Fixes

### 1. Fix Redirect URI (CRITICAL)

The redirect URI must match your backend server URL + callback route.

**For Development**:
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
```

**For Production**:
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
```

**Current Issue**: 
- Current value: `https://connect.wpmailsmtp.com/google/`
- Should be: `http://localhost:5000/api/calendar/google/callback` (for dev) or your production URL

### 2. Update Google Cloud Console

After fixing the `.env` file, you MUST also update the redirect URI in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click **Edit**
5. Under **Authorized redirect URIs**, add:
   - Development: `http://localhost:5000/api/calendar/google/callback`
   - Production: `https://yourdomain.com/api/calendar/google/callback`
6. Remove the incorrect `https://connect.wpmailsmtp.com/google/` URI
7. Click **Save**

### 3. Verify Redirect URI Logic

The code uses this fallback logic (line 688):
```javascript
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/calendar/callback`;
```

**Note**: The fallback uses `/api/calendar/callback` but the actual route is `/api/calendar/google/callback`. This fallback won't work correctly.

**Recommendation**: Update the fallback to match the actual route:
```javascript
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/calendar/google/callback`;
```

However, since `GOOGLE_REDIRECT_URI` is set, this fallback won't be used. But it's still good to fix for consistency.

## 📋 Configuration Checklist

### Before Testing:
- [ ] Fix `GOOGLE_REDIRECT_URI` in `.env` file
- [ ] Update redirect URI in Google Cloud Console
- [ ] Verify `GOOGLE_CLIENT_ID` is correct
- [ ] Verify `GOOGLE_CLIENT_SECRET` is correct
- [ ] Ensure Google Calendar API is enabled in Google Cloud Console
- [ ] Verify OAuth consent screen is configured

### For Production:
- [ ] Update `GOOGLE_REDIRECT_URI` to production URL
- [ ] Update redirect URI in Google Cloud Console for production
- [ ] Ensure OAuth consent screen is published (for external users)
- [ ] Test OAuth flow end-to-end

## 🔍 How to Verify Configuration

### 1. Check Environment Variables
```bash
# Verify redirect URI is set correctly
grep GOOGLE_REDIRECT_URI .env
```

Should show:
```
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
```

### 2. Test OAuth Flow
1. Start the server: `npm run server`
2. Check logs for: `Google Calendar OAuth client initialized`
3. Navigate to Settings page in web app
4. Click "Connect Google Calendar"
5. Should redirect to Google OAuth page
6. After authorization, should redirect back to your callback URL

### 3. Verify Callback Route
The callback route `/api/calendar/google/callback` should:
- Receive the `code` parameter from Google
- Exchange code for tokens
- Store user credentials
- Redirect to frontend with success/error status

## 🚨 Common Issues & Solutions

### Issue: "redirect_uri_mismatch" Error
**Cause**: Redirect URI in `.env` doesn't match Google Cloud Console  
**Solution**: 
1. Ensure exact match between `.env` and Google Cloud Console
2. Check for trailing slashes (should match exactly)
3. Verify protocol (http vs https)

### Issue: "Google OAuth client not initialized"
**Cause**: Missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`  
**Solution**: Check `.env` file has both variables set

### Issue: Callback not working
**Cause**: Redirect URI points to wrong URL  
**Solution**: 
1. Verify callback route exists: `/api/calendar/google/callback`
2. Ensure redirect URI matches backend server URL (not frontend)
3. Check server is running on correct port

## 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Client ID | ✅ Set | Verify it's correct |
| Client Secret | ✅ Set | Verify it's correct |
| Redirect URI | ❌ **WRONG** | Points to WordPress SMTP, not this app |
| Callback Route | ✅ Exists | `/api/calendar/google/callback` |
| Code Implementation | ✅ Good | Properly structured |
| Google Cloud Config | ⚠️ Needs Update | Must match `.env` |

## 🎯 Action Items

### Immediate (Required):
1. **Fix `.env` file**:
   ```env
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
   ```

2. **Update Google Cloud Console**:
   - Add correct redirect URI
   - Remove incorrect WordPress SMTP URI

3. **Test OAuth Flow**:
   - Restart server
   - Try connecting Google Calendar
   - Verify callback works

### Optional (Code Improvement):
1. Fix fallback redirect URI in `server/index.js` line 688 to use `/api/calendar/google/callback`

## ✅ Correct Configuration Example

### Development `.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
FRONTEND_URL=http://localhost:3000
```

### Production `.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

**Next Steps**:
1. ⚠️ **URGENT**: Fix `GOOGLE_REDIRECT_URI` in `.env`
2. ⚠️ **URGENT**: Update Google Cloud Console redirect URI
3. ✅ Test OAuth flow after fixes
4. ✅ Verify calendar integration works end-to-end

