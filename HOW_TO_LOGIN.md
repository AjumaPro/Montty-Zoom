# How to Login to the Dashboard

## Regular User Login

### Step 1: Access the Sign-In Page
1. Open your browser and navigate to: `http://localhost:3000/signin`
2. Or if deployed, go to your application URL + `/signin`

### Step 2: Enter Your Information
- **Email Address**: Enter any valid email address (e.g., `user@example.com`)
- **Your Name**: Enter your name (e.g., `John Doe`)
- **No password required** - The app uses email-based authentication

### Step 3: Sign In
- Click the "Sign In" button
- You'll be automatically redirected to the dashboard (`/`)
- A free plan will be automatically activated for you

## Admin Dashboard Login

### To Access Admin Dashboard:

1. **Sign in with admin email**:
   - Email: `infoajumapro@gmail.com`
   - Name: Enter any name (e.g., `Admin`)

2. **After sign-in**:
   - You'll see the regular dashboard
   - Look for **"Admin Dashboard"** link in the left sidebar (under General section)
   - Or click the **shield icon** (🛡️) in the top navigation bar
   - This will take you to `/admin`

3. **Admin Dashboard Features**:
   - View all users
   - View all subscriptions
   - View all rooms/meetings
   - View statistics and analytics
   - Manage the platform

## Quick Start

### For Regular Users:
```
1. Go to http://localhost:3000/signin
2. Enter email: your.email@example.com
3. Enter name: Your Name
4. Click "Sign In"
5. You're on the dashboard!
```

### For Admin:
```
1. Go to http://localhost:3000/signin
2. Enter email: infoajumapro@gmail.com
3. Enter name: Admin
4. Click "Sign In"
5. Click "Admin Dashboard" in sidebar or shield icon in nav
```

## Notes

- **No password required** - Just email and name
- **Auto-activation**: Free plan is automatically activated on first sign-in
- **Session**: Your session persists until you log out
- **Admin Access**: Only `infoajumapro@gmail.com` can access admin dashboard

## Troubleshooting

### Can't see dashboard?
- Make sure backend server is running on port 5000
- Check browser console for errors
- Verify you're signed in (check localStorage for `isAuthenticated`)

### Can't see admin dashboard?
- Make sure you signed in with `infoajumapro@gmail.com`
- Check that the email matches exactly (case-sensitive)
- Refresh the page after sign-in

### Server not running?
```bash
# Start backend server
cd /Users/newuser/Documents/AJUMAPRO\ BUSINESS/montty-zoom
npm run server

# In another terminal, start web app
cd web-app
npm start
```

## URLs

- **Sign In**: `http://localhost:3000/signin`
- **Dashboard**: `http://localhost:3000/`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Pricing**: `http://localhost:3000/pricing`
- **Subscription**: `http://localhost:3000/subscription`

