# Adding Montty Zoom to Existing Google Cloud Console Project

## ✅ Yes, You Can Use an Existing Project!

You can absolutely add Montty Zoom to an existing Google Cloud Console project. This is actually a common practice and has several benefits:

### Benefits of Using Existing Project:
- ✅ Centralized management of all your applications
- ✅ Shared billing and quotas
- ✅ Easier to manage multiple services
- ✅ No need to create a new project

### Considerations:
- ⚠️ All OAuth clients share the same project quotas
- ⚠️ If one app exceeds quota, all apps are affected
- ✅ You can create separate OAuth Client IDs for each application

## 📋 Step-by-Step Guide

### Option 1: Add New OAuth Client ID to Existing Project (Recommended)

This is the recommended approach - create a separate OAuth Client ID specifically for Montty Zoom.

#### Step 1: Access Your Existing Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project from the project dropdown (top bar)
3. Navigate to: **APIs & Services** > **Credentials**

#### Step 2: Enable Google Calendar API (if not already enabled)

1. Go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it
4. If not enabled, click **Enable**
5. If already enabled, you'll see "API enabled" - you're good!

#### Step 3: Create New OAuth 2.0 Client ID for Montty Zoom

1. In **APIs & Services** > **Credentials**, click **+ CREATE CREDENTIALS**
2. Select **OAuth client ID**

#### Step 4: Configure OAuth Consent Screen (if not done)

If you haven't configured OAuth consent screen yet:
1. You'll be prompted to configure it
2. Choose **External** (unless you have Google Workspace)
3. Fill in:
   - **App name**: "Montty Zoom" (or your preferred name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. **Scopes**: Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **Save and Continue**
7. **Test users** (for development): Add your email if needed
8. Click **Save and Continue**
9. Review and **Back to Dashboard**

#### Step 5: Create OAuth Client ID

1. **Application type**: Select **Web application**
2. **Name**: "Montty Zoom Calendar" (or descriptive name)
3. **Authorized redirect URIs**: Add:
   - Development: `http://localhost:5000/api/calendar/google/callback`
   - Production: `https://yourdomain.com/api/calendar/google/callback`
4. Click **Create**
5. **Copy the Client ID and Client Secret** - you'll need these!

#### Step 6: Update Your .env File

Add the new credentials to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_new_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
```

### Option 2: Use Existing OAuth Client ID (Not Recommended)

You *could* reuse an existing OAuth Client ID, but this is **NOT recommended** because:

- ❌ Different redirect URIs might conflict
- ❌ Security risk if one app is compromised
- ❌ Harder to manage and debug
- ❌ Can't revoke access per application

**Only do this if:**
- You're testing/developing
- The existing client ID has the same redirect URI
- You understand the security implications

## 🔍 How to Check Your Existing Setup

### Check Existing OAuth Clients:

1. Go to **APIs & Services** > **Credentials**
2. Look for **OAuth 2.0 Client IDs** section
3. You'll see all your existing OAuth clients listed
4. Each has:
   - Name
   - Client ID
   - Application type
   - Authorized redirect URIs

### Check Enabled APIs:

1. Go to **APIs & Services** > **Enabled APIs**
2. Look for "Google Calendar API"
3. If it's listed, it's enabled ✅
4. If not, enable it (see Step 2 above)

## 📝 Best Practices

### 1. Separate Client IDs Per Application
- ✅ Create one OAuth Client ID per application/service
- ✅ Name them clearly (e.g., "Montty Zoom Calendar", "WordPress SMTP")
- ✅ This allows independent management

### 2. Organize Redirect URIs
- ✅ Group by environment (dev/staging/prod)
- ✅ Use descriptive names in Google Console
- ✅ Document which redirect URI belongs to which app

### 3. Security
- ✅ Keep Client Secrets secure (never commit to Git)
- ✅ Use different secrets for dev/prod if possible
- ✅ Regularly rotate credentials
- ✅ Monitor API usage

## 🎯 Quick Checklist

### Before Adding Montty Zoom:
- [ ] Access your existing Google Cloud project
- [ ] Verify Google Calendar API is enabled
- [ ] Check OAuth consent screen is configured

### Creating OAuth Client:
- [ ] Create new OAuth Client ID (don't reuse existing)
- [ ] Name it "Montty Zoom Calendar" or similar
- [ ] Add correct redirect URIs:
  - `http://localhost:5000/api/calendar/google/callback` (dev)
  - `https://yourdomain.com/api/calendar/google/callback` (prod)
- [ ] Copy Client ID and Client Secret

### After Creating:
- [ ] Update `.env` file with new credentials
- [ ] Remove old incorrect redirect URI from Google Console
- [ ] Test OAuth flow
- [ ] Verify calendar integration works

## 🔧 Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure redirect URI in `.env` exactly matches one in Google Console

### Issue: "OAuth consent screen not configured"
**Solution**: Complete OAuth consent screen setup (Step 4)

### Issue: "Google Calendar API not enabled"
**Solution**: Enable Google Calendar API in API Library

### Issue: Multiple apps sharing same client ID
**Solution**: Create separate OAuth Client ID for Montty Zoom

## 📊 Example: Multiple Apps in Same Project

Your Google Cloud Console might look like this:

```
Project: my-company-project
├── APIs Enabled:
│   ├── Google Calendar API ✅
│   ├── Gmail API ✅
│   └── Other APIs...
│
└── OAuth 2.0 Client IDs:
    ├── WordPress SMTP
    │   └── Redirect URI: https://connect.wpmailsmtp.com/google/
    │
    ├── Montty Zoom Calendar (NEW)
    │   ├── Redirect URI: http://localhost:5000/api/calendar/google/callback
    │   └── Redirect URI: https://yourdomain.com/api/calendar/google/callback
    │
    └── Other Applications...
```

## ✅ Summary

**Yes, you can add Montty Zoom to your existing Google Cloud Console project!**

**Recommended Approach**:
1. ✅ Use your existing project
2. ✅ Create a NEW OAuth Client ID specifically for Montty Zoom
3. ✅ Configure correct redirect URIs
4. ✅ Update `.env` with new credentials

**Don't**:
- ❌ Reuse existing OAuth Client ID (unless redirect URIs match exactly)
- ❌ Mix redirect URIs from different applications

---

**Next Steps**:
1. Go to your existing Google Cloud Console project
2. Create new OAuth Client ID for Montty Zoom
3. Update `.env` file with new credentials
4. Test the integration

