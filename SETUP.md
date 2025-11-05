# Quick Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Flutter SDK** (for mobile app) - [Install Flutter](https://flutter.dev/docs/get-started/install)

## Installation Steps

### 1. Install Backend Dependencies
```bash
npm install
```

### 2. Install Web App Dependencies
```bash
cd web-app
npm install
cd ..
```

### 3. Install Flutter Dependencies
```bash
cd mobile-app
flutter pub get
cd ..
```

### 4. Run the Application

#### Option A: Run Everything Together (Development)
```bash
npm run dev
```
This starts:
- Backend server on `http://localhost:5000`
- React web app on `http://localhost:3000`

#### Option B: Run Separately

**Backend:**
```bash
npm run server
```

**Web App (in another terminal):**
```bash
npm run client
```

**Mobile App (in another terminal):**
```bash
cd mobile-app
flutter run
```

## Configuration

### For Web App
Create `web-app/.env` file:
```
REACT_APP_API_URL=http://localhost:5000
```

### For Mobile App
Update API URL in:
- `mobile-app/lib/screens/home_screen.dart`
- `mobile-app/lib/screens/room_screen.dart`

Change `localhost` to your computer's IP address if testing on a physical device:
```dart
const String API_URL = 'http://YOUR_IP_ADDRESS:5000';
```

To find your IP address:
- **macOS/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

## Testing

1. Open browser to `http://localhost:3000`
2. Enter your name
3. Click "Create Room"
4. Open another browser tab/window
5. Join using the room ID
6. You should see both video feeds!

## Troubleshooting

### Camera/Microphone Issues
- Make sure you've granted browser/app permissions
- Check that no other app is using the camera/mic
- For production, HTTPS is required for WebRTC

### Connection Issues
- Ensure firewall allows connections on ports 3000 and 5000
- Check that both devices are on the same network (for local testing)
- Verify STUN servers are accessible

### Mobile App Connection
- Use your computer's local IP, not `localhost`
- Ensure mobile device and computer are on the same Wi-Fi network
- Check firewall settings

## Production Deployment

For production, you'll need:
1. HTTPS/WSS for secure WebRTC connections
2. TURN servers for better connectivity
3. Environment variables properly configured
4. Build the React app: `cd web-app && npm run build`
5. Deploy backend and serve React build from Express

## Next Steps

- Add authentication
- Implement TURN servers for better connectivity
- Add screen sharing
- Implement chat functionality
- Add cloud storage for recordings

