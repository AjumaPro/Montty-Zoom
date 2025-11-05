# How to Login - Server Must Be Running

## ⚠️ IMPORTANT: Backend Server Must Be Running

The sign-in will fail if the backend server is not running. You need to start the backend server first!

## Quick Start (Both Servers)

### Option 1: Start Both Servers Together (Recommended)
```bash
cd /Users/newuser/Documents/AJUMAPRO\ BUSINESS/montty-zoom
npm run dev
```
This starts both backend (port 5000) and frontend (port 3000) together.

### Option 2: Start Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd /Users/newuser/Documents/AJUMAPRO\ BUSINESS/montty-zoom
npm run server
```
Wait for: "Server running on http://localhost:5000"

**Terminal 2 - Frontend Server:**
```bash
cd /Users/newuser/Documents/AJUMAPRO\ BUSINESS/montty-zoom/web-app
npm start
```
Wait for: "webpack compiled successfully" and browser opens to `http://localhost:3000`

## Login Steps

### Regular User:
1. Go to: `http://localhost:3000/signin`
2. Enter:
   - Email: `your.email@example.com`
   - Name: `Your Name`
3. Click "Sign In"
4. You'll be redirected to dashboard

### Admin Dashboard:
1. Go to: `http://localhost:3000/signin`
2. Enter:
   - Email: `infoajumapro@gmail.com` (exact match required)
   - Name: `Admin` (or any name)
3. Click "Sign In"
4. Click "Admin Dashboard" in sidebar or shield icon in nav bar

## Verify Server is Running

Check if backend is running:
```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok"}` or similar

If you get "Connection refused", the server is not running.

## Troubleshooting

### Error: "Cannot connect to server"
- Backend server is not running on port 5000
- Start it with: `npm run server` from project root

### Error: "Failed to sign in"
- Check if backend server is running
- Check browser console for errors
- Verify port 5000 is not blocked

### Multiple "Failed to sign in" errors
- Clear browser cache
- Refresh page
- Make sure backend server is running

## Server Status Check

To check if servers are running:
```bash
# Check backend (port 5000)
lsof -ti:5000

# Check frontend (port 3000)
lsof -ti:3000
```

If nothing is returned, the server is not running.

