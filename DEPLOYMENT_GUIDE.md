# Deployment Guide

This guide will help you deploy Montty Zoom to production.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed (for containerized deployment)
- PostgreSQL database (or MongoDB)
- SSL certificates (for HTTPS)
- Domain name configured

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your production values
nano .env
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd web-app
npm install
cd ..
```

### 3. Build Frontend

```bash
cd web-app
npm run build
cd ..
```

### 4. Verify Build

```bash
npm run verify-build
```

## Deployment Options

### Option A: Docker Deployment (Recommended)

#### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Docker Build

```bash
# Build backend image
docker build -t montty-zoom-backend .

# Build frontend image
docker build -t montty-zoom-frontend ./web-app

# Run containers
docker run -d -p 5000:5000 --env-file .env montty-zoom-backend
docker run -d -p 80:80 montty-zoom-frontend
```

### Option B: Traditional Deployment

#### Backend Deployment

```bash
# Start backend server
NODE_ENV=production PORT=5000 node server/index.js

# Or using PM2 (recommended)
npm install -g pm2
pm2 start server/index.js --name montty-zoom-backend --env production
pm2 save
pm2 startup
```

#### Frontend Deployment

Serve the built files from `web-app/build` using:
- Nginx (recommended)
- Apache
- Any static file server

Example Nginx configuration is provided in `web-app/nginx.conf`

## Environment Variables

### Required Variables

- `NODE_ENV=production`
- `PORT=5000`
- `ALLOWED_ORIGINS=https://yourdomain.com`
- `FRONTEND_URL=https://yourdomain.com`

### Optional Variables

- `DATABASE_URL` - PostgreSQL or MongoDB connection string
- `SSL_KEY_PATH` - Path to SSL private key
- `SSL_CERT_PATH` - Path to SSL certificate
- `GOOGLE_CLIENT_ID` - For calendar integration
- `GOOGLE_CLIENT_SECRET` - For calendar integration
- `REACT_APP_TURN_SERVERS` - JSON array of TURN servers

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in /etc/letsencrypt/live/yourdomain.com/
```

Update `.env`:
```
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Using Nginx as Reverse Proxy

1. Install Nginx
2. Configure SSL in Nginx
3. Proxy requests to backend on port 5000
4. Serve frontend static files

Example Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/web-app/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Database Setup

### PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE monttyzoom;
CREATE USER monttyzoom WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE monttyzoom TO monttyzoom;

# Update .env
DATABASE_URL=postgresql://monttyzoom:your_password@localhost:5432/monttyzoom
```

### MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb

# Update .env
DATABASE_URL=mongodb://localhost:27017/monttyzoom
```

## TURN Server Setup

For better WebRTC connectivity, configure TURN servers:

1. **Twilio** (Paid, reliable):
   - Sign up at https://www.twilio.com
   - Get TURN credentials
   - Add to `.env`:
   ```
   REACT_APP_TURN_SERVERS=[{"url":"turn:global.turn.twilio.com:3478","username":"your_username","credential":"your_credential"}]
   ```

2. **Self-hosted Coturn** (Free):
   ```bash
   sudo apt-get install coturn
   # Configure /etc/turnserver.conf
   # Add to .env with your server details
   ```

## Monitoring

### Health Check

```bash
# Check backend health
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123,"environment":"production"}
```

### Logs

```bash
# View logs
tail -f logs/combined.log
tail -f logs/error.log

# Or with Docker
docker-compose logs -f backend
```

## Security Checklist

- [ ] HTTPS/WSS configured
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] SSL certificates valid
- [ ] Firewall configured
- [ ] Regular backups scheduled

## Troubleshooting

### WebRTC not working

- Ensure HTTPS is enabled
- Check TURN server configuration
- Verify firewall allows WebRTC ports
- Check browser console for errors

### Database connection issues

- Verify DATABASE_URL is correct
- Check database is running
- Verify credentials
- Check network connectivity

### Build fails

- Run `npm run verify-build`
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check for syntax errors

## Support

For issues, check:
- `DEPLOYMENT_READINESS_REPORT.md` for known issues
- `DEPLOYMENT_CHECKLIST.md` for deployment steps
- Logs in `logs/` directory

