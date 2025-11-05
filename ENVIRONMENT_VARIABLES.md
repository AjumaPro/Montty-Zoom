# Required Environment Variables Guide

## 🔴 REQUIRED for Production

### 1. Server Configuration
```env
NODE_ENV=production
PORT=5000
```
- `NODE_ENV`: Must be set to `production` for production deployment
- `PORT`: Port number for the backend server (default: 5000)

### 2. CORS Configuration
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```
- **Required**: Comma-separated list of allowed origins
- **Example**: `https://monttyzoom.com,https://www.monttyzoom.com`
- **Important**: Must include your production domain(s)
- **Development**: `http://localhost:3000,http://localhost:3001`

### 3. Frontend URL
```env
FRONTEND_URL=https://yourdomain.com
```
- **Required**: Your frontend application URL
- Used for redirects and callbacks (e.g., calendar OAuth)
- **Example**: `https://monttyzoom.com`
- **Development**: `http://localhost:3000`

## 🟡 HIGHLY RECOMMENDED for Production

### 4. Database (Required for data persistence)
```env
# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/monttyzoom

# OR MongoDB
DATABASE_URL=mongodb://localhost:27017/monttyzoom
```
- **Without this**: Application uses in-memory storage (data lost on restart)
- **Production**: Must configure for data persistence
- **Format**: Standard connection string format

### 5. SSL/TLS Certificates (Required for HTTPS/WSS)
```env
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
SSL_CA_PATH=/path/to/ca-bundle.crt  # Optional
```
- **Required for**: HTTPS and WebRTC to work properly
- **Without this**: WebRTC will fail (browsers require HTTPS)
- **Recommendation**: Use Let's Encrypt certificates
- **Example paths**:
  - Let's Encrypt: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
  - Let's Encrypt: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`

## 🟢 OPTIONAL (Feature-Specific)

### 6. Google Calendar Integration
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
```
- **Optional**: Only needed if using calendar integration
- **Get from**: Google Cloud Console
- **See**: `CALENDAR_SETUP.md` for instructions

### 7. Email Configuration (for meeting invites)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@yourdomain.com
```
- **Optional**: Only needed for email notifications
- **Gmail**: Use App Password (not regular password)
- **Other providers**: Adjust host/port accordingly

### 8. YouTube Live Streaming
```env
YOUTUBE_RTMP_URL=rtmp://a.rtmp.youtube.com/live2
YOUTUBE_STREAM_KEY=your_youtube_stream_key_here
YOUTUBE_BACKUP_RTMP_URL=rtmp://b.rtmp.youtube.com/live2?backup=1
```
- **Optional**: Only needed for YouTube live streaming
- **Get stream key**: YouTube Studio > Go Live > Stream settings

### 9. TURN Servers (for better WebRTC connectivity)
```env
REACT_APP_TURN_SERVERS=[{"url":"turn:turnserver.com:3478","username":"user","credential":"pass"}]
```
- **Optional**: Improves WebRTC connections in restrictive networks
- **Format**: JSON array of TURN server objects
- **Providers**: Twilio, AWS, or self-hosted (Coturn)
- **Without this**: Uses STUN servers only (may fail in corporate networks)

### 10. Rate Limiting (has defaults)
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
- **Optional**: Defaults provided (15 minutes, 100 requests)
- **Adjust**: Based on your needs

### 11. Logging
```env
LOG_LEVEL=info
```
- **Optional**: Defaults to `info`
- **Options**: `error`, `warn`, `info`, `debug`

### 12. Redis (for caching/sessions - future)
```env
REDIS_URL=redis://localhost:6379
```
- **Optional**: Not currently used but prepared for future use

## 📋 Quick Setup Checklist

### Minimum for Production:
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (or your preferred port)
- [ ] `ALLOWED_ORIGINS` (your production domain)
- [ ] `FRONTEND_URL` (your production domain)
- [ ] `DATABASE_URL` (PostgreSQL or MongoDB)
- [ ] `SSL_KEY_PATH` and `SSL_CERT_PATH` (for HTTPS)

### Recommended:
- [ ] Email configuration (for notifications)
- [ ] TURN servers (for better connectivity)
- [ ] Google Calendar (if using calendar features)

## 🔧 Environment Setup Examples

### Minimal Production Setup
```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://monttyzoom.com
FRONTEND_URL=https://monttyzoom.com
DATABASE_URL=postgresql://user:pass@localhost:5432/monttyzoom
SSL_KEY_PATH=/etc/letsencrypt/live/monttyzoom.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/monttyzoom.com/fullchain.pem
```

### Full Production Setup (with all features)
```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://monttyzoom.com,https://www.monttyzoom.com
FRONTEND_URL=https://monttyzoom.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/monttyzoom

# SSL
SSL_KEY_PATH=/etc/letsencrypt/live/monttyzoom.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/monttyzoom.com/fullchain.pem

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@monttyzoom.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@monttyzoom.com

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://monttyzoom.com/api/calendar/google/callback

# TURN Servers
REACT_APP_TURN_SERVERS=[{"url":"turn:global.turn.twilio.com:3478","username":"user","credential":"pass"}]

# Logging
LOG_LEVEL=info
```

### Development Setup
```env
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

## ⚠️ Important Notes

1. **HTTPS is REQUIRED** for WebRTC in production - browsers will block WebRTC without HTTPS
2. **Database is REQUIRED** for production - without it, all data is lost on server restart
3. **CORS origins** must match your actual frontend domain(s)
4. **Never commit** `.env` file to version control
5. **Use environment variables** in your hosting platform (don't hardcode secrets)

## 🚨 Security Best Practices

- Use strong passwords for database
- Keep SSL certificates secure
- Rotate secrets regularly
- Use different credentials for development/production
- Never expose `.env` file publicly
- Use secret management services (AWS Secrets Manager, etc.) in production

## 📝 Validation

After setting up your `.env` file, verify it works:

```bash
# Check if server starts
npm run server

# Verify health endpoint
curl http://localhost:5000/api/health

# Check build
npm run verify-build
```

For questions, see `DEPLOYMENT_GUIDE.md`

