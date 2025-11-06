# Deployment Platforms Guide for Testing & MVP

## Quick Comparison

| Platform | Free Tier | Docker | WebSocket | Best For | Setup Time |
|----------|-----------|--------|-----------|----------|------------|
| **Railway** | ✅ Yes | ✅ Yes | ✅ Yes | MVP | ⭐⭐⭐⭐⭐ |
| **Render** | ✅ Yes | ✅ Yes | ✅ Yes | Testing | ⭐⭐⭐⭐ |
| **Fly.io** | ✅ Yes | ✅ Yes | ✅ Yes | WebRTC Apps | ⭐⭐⭐ |
| **DigitalOcean** | ❌ No | ✅ Yes | ✅ Yes | Production MVP | ⭐⭐⭐⭐ |
| **Vercel + Railway** | ✅ Yes | Partial | ✅ Yes | Optimized Frontend | ⭐⭐⭐⭐ |

## Recommended: Railway (Best for MVP)

### Why Railway?
- ✅ **Zero-config deployment** - Just connect GitHub
- ✅ **Free tier** - $5 credit/month (enough for testing)
- ✅ **Docker support** - Your docker-compose.yml works
- ✅ **No database needed** - Using Supabase (already configured!)
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **WebSocket support** - Perfect for Socket.io
- ✅ **Environment variables** - Easy .env management

### Quick Setup Steps:

1. **Sign up**: https://railway.app
2. **Create new project** → "Deploy from GitHub repo"
3. **Add backend service**:
   - Connect your repo
   - Root directory: `/`
   - Build command: `npm install`
   - Start command: `node server/index.js`
   - Port: `5000`
4. **Add frontend service**:
   - Root directory: `/web-app`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build -l 80`
   - Or use nginx (see Dockerfile)

### Environment Variables to Set:
```
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://your-app.railway.app
FRONTEND_URL=https://your-app.railway.app
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here (if needed)
```

**Note**: No `DATABASE_URL` needed - Supabase handles all database operations!

### Cost: ~$5-10/month for MVP (no database hosting cost!)

---

## Alternative: Render (Great for Testing)

### Why Render?
- ✅ **Free tier** - 750 hours/month
- ✅ **Docker support**
- ✅ **Auto-deploy from Git**
- ✅ **WebSocket support**
- ⚠️ **Spins down** after 15min inactivity (free tier)

### Setup:
1. Sign up: https://render.com
2. Create **Web Service** for backend
3. Create **Static Site** for frontend
4. **No database needed** - Using Supabase!

### Cost: Free for testing, $7/month for always-on (no database cost!)

---

## Alternative: Fly.io (Best for WebRTC)

### Why Fly.io?
- ✅ **Global edge network** - Low latency for video calls
- ✅ **Generous free tier** - 3 shared VMs
- ✅ **Docker support**
- ✅ **Perfect for WebRTC** - Edge locations worldwide

### Setup:
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch` (in your project root)
4. Deploy: `fly deploy`

### Cost: Free tier, then pay-as-you-go (~$2-5/month for MVP)

---

## Alternative: Vercel (Frontend) + Railway (Backend)

### Why Split Deployment?
- ✅ **Vercel** - Optimized React deployment, CDN, edge functions
- ✅ **Railway** - Backend with WebSocket support
- ✅ **Best performance** for frontend

### Setup:
1. **Frontend (Vercel)**:
   - Connect GitHub repo
   - Root directory: `web-app`
   - Build command: `npm run build`
   - Output directory: `build`

2. **Backend (Railway)**:
   - Follow Railway setup above
   - Update `FRONTEND_URL` to Vercel URL

### Cost: Free tier for both

---

## Mobile App Deployment

### For Flutter Mobile App:

1. **Firebase App Distribution** (Testing)
   - Free tier available
   - Easy beta testing
   - Setup: https://firebase.google.com/docs/app-distribution

2. **TestFlight (iOS)** + **Google Play Internal Testing**
   - Free for testing
   - Required for app store submission

3. **Expo** (If using Expo)
   - Free tier
   - Easy OTA updates

---

## Database: Supabase (Already Configured!) ✅

### Your Current Setup:
- ✅ **Supabase** - Already configured and working
- ✅ **Project URL**: `https://ptjnlzrvqyynklzdipac.supabase.co`
- ✅ **Free tier**: 500MB database, 2GB bandwidth
- ✅ **Perfect for MVP** - No additional database setup needed!

### What This Means:
- **No PostgreSQL service needed** on Railway/Render/Fly.io
- **No database hosting costs** - Supabase handles it
- **Just set environment variables** for Supabase connection
- **Your backend already prioritizes Supabase** (see `server/utils/database.js`)

### Required Environment Variables:
```env
SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
```

### Get Your Keys:
1. Go to: https://app.supabase.com/project/ptjnlzrvqyynklzdipac/settings/api
2. Copy the **anon/public** key
3. Set it in your deployment platform's environment variables

---

## TURN Server for WebRTC

### For MVP Testing:
1. **Twilio** (Recommended)
   - Free trial: $20 credit
   - Reliable TURN servers
   - Setup: https://www.twilio.com/stun-turn

2. **Metered.ca** (Cheaper alternative)
   - $0.004 per GB
   - Good for MVP

3. **Self-hosted Coturn** (Advanced)
   - Free but requires server management

---

## Recommended MVP Stack

### Option 1: All-in-One (Easiest) ⭐ RECOMMENDED
```
Frontend + Backend: Railway
Database: Supabase ✅ (already configured!)
TURN Server: Twilio (free trial)
Mobile Testing: Firebase App Distribution
Cost: $0-5/month (free tier) or $10/month (paid)
```

### Option 2: Optimized Performance
```
Frontend: Vercel (free tier)
Backend: Railway
Database: Supabase ✅ (already configured!)
TURN Server: Twilio
Mobile Testing: Firebase App Distribution
Cost: $0-5/month (free tier) or $10/month (paid)
```

### Option 3: Cost-Conscious
```
Frontend + Backend: Render (free tier)
Database: Supabase ✅ (already configured!)
TURN Server: Metered.ca
Mobile Testing: Firebase App Distribution
Cost: $0/month (free tier) or $7/month (paid)
```

**All options use Supabase** - no database hosting costs! 🎉

---

## Quick Start Commands

### Railway CLI:
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Render CLI:
```bash
npm install -g render-cli
render login
render deploy
```

### Fly.io CLI:
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
fly launch
fly deploy
```

---

## Environment Variables Checklist

Make sure these are set in your deployment platform:

### Required:
- `NODE_ENV=production`
- `PORT=5000`
- `ALLOWED_ORIGINS` (your frontend URL)
- `FRONTEND_URL` (your frontend URL)

### Supabase (Your Database):
- `SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co`
- `SUPABASE_ANON_KEY` (get from Supabase dashboard)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

**Note**: No `DATABASE_URL` needed - Supabase handles all database operations!

### Google Calendar (if using):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### WebRTC:
- `REACT_APP_TURN_SERVERS` (JSON array)

---

## Cost Estimate for MVP

| Service | Free Tier | Paid MVP |
|---------|-----------|----------|
| Railway | $5 credit/month | $10/month |
| Render | 750 hrs/month | $7/month |
| Fly.io | 3 VMs | $2-5/month |
| **Supabase** | **500MB DB** | **Free** ✅ |
| Twilio TURN | $20 trial | $5-10/month |
| **Total** | **~$0-5/month** | **~$12-20/month** |

**Savings**: No database hosting cost since Supabase is free tier!

---

## Next Steps

1. **Choose Railway** for easiest MVP deployment
2. **Connect GitHub** repository
3. **Deploy backend** service (no database setup needed!)
4. **Deploy frontend** service
5. **Set Supabase environment variables**:
   - `SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co`
   - `SUPABASE_ANON_KEY` (from Supabase dashboard)
6. **Set other environment variables** (CORS, frontend URL, etc.)
7. **Test WebSocket** connections
8. **Configure TURN** servers for WebRTC

**Remember**: Your database is already on Supabase - no additional database service needed!

---

## Simplified Deployment (Supabase Only)

Since you're using Supabase, your deployment is simpler:

### What You DON'T Need:
- ❌ PostgreSQL service on Railway/Render/Fly.io
- ❌ Database connection strings (`DATABASE_URL`)
- ❌ Database migrations on deployment platform
- ❌ Database backups (Supabase handles this)
- ❌ Database hosting costs

### What You DO Need:
- ✅ Backend service (Node.js/Express)
- ✅ Frontend service (React build)
- ✅ Supabase environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- ✅ WebSocket support (for Socket.io)
- ✅ TURN server (for WebRTC)

### Your Backend Already Handles This:
Your `server/utils/database.js` automatically:
1. **Prioritizes Supabase** if configured
2. Falls back to PostgreSQL/MongoDB if Supabase unavailable
3. Uses in-memory storage as last resort

So deployment is just:
1. Deploy backend + frontend
2. Set Supabase env vars
3. Done! 🎉

---

## Docker Compose Note

Your `docker-compose.yml` includes PostgreSQL for **local development**. That's fine! For production deployment on Railway/Render/Fly.io, you can:
- **Option A**: Deploy without docker-compose (just backend + frontend services)
- **Option B**: Use docker-compose but remove PostgreSQL service (use Supabase)
- **Option C**: Keep docker-compose as-is for local dev, deploy services separately

---

## Support Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

