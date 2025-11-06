# Railway Deployment Guide

## Quick Start

1. **Connect your GitHub repository to Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Set Environment Variables**
   - Go to your service → Variables tab
   - Add all required variables (see below)

3. **Deploy**
   - Railway will automatically detect the build configuration
   - It will run `npm run build:production` to build the app
   - Then start with `node server/index.js`

## Environment Variables Required

### Required:
```
NODE_ENV=production
PORT=5000
```

### Supabase (Required):
```
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### CORS & Frontend:
```
ALLOWED_ORIGINS=https://your-app.railway.app
FRONTEND_URL=https://your-app.railway.app
```

**Note**: Replace `your-app.railway.app` with your actual Railway URL after first deployment.

### Optional (if using features):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.railway.app/api/calendar/google/callback
REACT_APP_TURN_SERVERS=[your TURN servers JSON]
```

## Build Process

Railway will:
1. Install dependencies: `npm install`
2. Install frontend dependencies: `cd web-app && npm install`
3. Build React app: `cd web-app && npm run build`
4. Start server: `node server/index.js`

The server will automatically serve the built React app from `web-app/build` in production mode.

## Files Created

- `Procfile` - Tells Railway how to start the app
- `railway.json` - Railway-specific configuration
- Updated `package.json` - Added `build:production` and `start` scripts
- Updated `server/index.js` - Serves React build in production

## Verification

After deployment:
1. Check logs for: "Serving React app from: ..."
2. Visit your Railway URL - should see the React app
3. Test API: `https://your-app.railway.app/api/health`
4. Test frontend: `https://your-app.railway.app`

## Troubleshooting

### Build fails
- Check Railway logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

### Frontend not loading
- Check if `web-app/build` directory exists after build
- Verify `NODE_ENV=production` is set
- Check server logs for "Serving React app from" message

### API not working
- Verify `ALLOWED_ORIGINS` includes your Railway URL
- Check CORS configuration
- Verify environment variables are set correctly

