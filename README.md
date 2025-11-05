# Montty Zoom - Video Call Application

A modern video call application similar to Zoom, built with React for web and Flutter for mobile, supporting desktop, mobile, and browser platforms.

## Features

- 🎥 **Video & Audio Calls** - High-quality video and audio calls using WebRTC
- 📱 **Multi-Platform** - Works on web browsers, desktop, and mobile devices
- 🔗 **URL-Based Joining** - Join rooms using shareable URLs
- 📷 **QR Code Support** - Quick room joining via QR code scanning
- 🔴 **Call Recording** - Record video calls for later viewing
- 📺 **Live Streaming** - Stream meetings to YouTube, Facebook, Twitch, and other platforms
- 🎨 **Modern UI** - Beautiful, intuitive interface
- 👥 **Multi-User Support** - Host meetings with multiple participants

## Tech Stack

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **WebRTC** - Peer-to-peer video/audio

### Web App
- **React** - Frontend framework
- **React Router** - Navigation
- **Socket.io Client** - WebSocket communication
- **QRCode React** - QR code generation

### Mobile App
- **Flutter** - Cross-platform mobile framework
- **flutter_webrtc** - WebRTC implementation
- **socket_io_client** - WebSocket communication
- **qr_flutter** - QR code generation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Flutter SDK (for mobile app)
- FFmpeg (for live streaming feature) - Install FFmpeg on your system:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html

### Installation

1. **Clone the repository**
   ```bash
   cd montty-zoom
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install web app dependencies**
   ```bash
   cd web-app
   npm install
   cd ..
   ```

4. **Install Flutter dependencies**
   ```bash
   cd mobile-app
   flutter pub get
   cd ..
   ```

### Running the Application

#### Development Mode (All at once)
```bash
npm run dev
```

This will start both the backend server and React web app concurrently.

#### Individual Services

**Backend Server:**
```bash
npm run server
```
Server runs on `http://localhost:5000`

**Web App:**
```bash
npm run client
```
Web app runs on `http://localhost:3000`

**Mobile App:**
```bash
cd mobile-app
flutter run
```

### Environment Configuration

Create a `.env` file in the root directory (optional):
```
PORT=5000
REACT_APP_API_URL=http://localhost:5000
```

For production, update `REACT_APP_API_URL` in `web-app/.env.production` and Flutter API URL in `mobile-app/lib/screens/home_screen.dart` and `room_screen.dart`.

## Usage

### Creating a Room

1. Enter your name
2. Click "Create Room"
3. Share the room ID or QR code with participants

### Joining a Room

1. Enter your name
2. Enter the room ID or scan the QR code
3. Click "Join Room"

### During a Call

- **Toggle Video** - Enable/disable camera
- **Toggle Audio** - Mute/unmute microphone
- **Record** - Start/stop recording (recording saved locally)
- **Live Stream** - Stream meetings to YouTube, Facebook, Twitch, or custom RTMP servers (host only)
- **Leave Room** - Exit the call

## Project Structure

```
montty-zoom/
├── server/           # Backend server
│   └── index.js      # Express + Socket.io server
├── web-app/          # React web application
│   ├── src/
│   │   ├── pages/    # React pages
│   │   └── ...
│   └── public/
├── mobile-app/       # Flutter mobile application
│   └── lib/
│       └── screens/  # Flutter screens
└── package.json      # Root package.json
```

## WebRTC Configuration

The application uses Google's STUN servers for NAT traversal. For production, consider:
- Adding TURN servers for better connectivity
- Using services like Twilio, Agora, or custom TURN servers

## Recording

Call recordings are saved locally in WebM format. For production, consider:
- Server-side recording
- Cloud storage integration
- Multiple format support

## Security Considerations

For production deployment:
- Add authentication/authorization
- Use HTTPS/WSS for secure connections
- Implement rate limiting
- Add room password protection
- Validate and sanitize user inputs

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (with some limitations)
- Mobile browsers

## Mobile App Permissions

The mobile app requires:
- Camera permission
- Microphone permission
- Internet access

## Troubleshooting

### Camera/Microphone not working
- Check browser/app permissions
- Ensure HTTPS in production (required for WebRTC)
- Check if devices are not being used by another application

### Connection issues
- Check firewall settings
- Verify STUN/TURN servers are accessible
- Check network connectivity

### Mobile app connection
- Update API_URL in Flutter code to match your server IP
- Ensure both devices are on the same network or server is publicly accessible

## Future Enhancements

- [ ] Screen sharing
- [ ] Chat functionality
- [ ] Virtual backgrounds
- [ ] Meeting scheduling
- [ ] Cloud recording storage
- [ ] Mobile app for iOS and Android
- [ ] Desktop app (Electron)
- [ ] User authentication
- [ ] Room persistence
- [ ] Meeting history

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

