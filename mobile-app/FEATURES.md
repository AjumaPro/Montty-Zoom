# Mobile App Features

This document outlines all the features implemented in the Montty Zoom mobile application.

## Core Features

### 1. Meeting Scheduling
- **Create Meetings**: Schedule meetings with title, description, date, time, and duration
- **Edit Meetings**: Update existing scheduled meetings
- **Delete Meetings**: Remove scheduled meetings
- **View Meetings**: Grid and list view modes
- **Recurring Meetings**: Support for daily, weekly, and monthly recurring meetings
- **Meeting Details**: View full meeting information including password

### 2. Video Conferencing
- **Create/Join Rooms**: Create new rooms or join existing ones
- **Video/Audio Toggle**: Enable/disable camera and microphone
- **Multi-participant Support**: View multiple participants in grid layout
- **WebRTC Integration**: Real-time peer-to-peer video/audio streaming
- **STUN Server Support**: NAT traversal for connectivity

### 3. Chat
- **Real-time Messaging**: Send and receive messages during meetings
- **Message History**: View all chat messages in the meeting
- **User Identification**: Messages show sender name and are color-coded

### 4. Participants Management
- **View Participants**: See all participants in the meeting
- **Participant Status**: View video/audio status for each participant
- **Host Identification**: See who is the host
- **Participant Count**: Real-time count of participants

### 5. Reactions
- **Emoji Reactions**: Send quick reactions (👍, 👎, ❤️, 😂, 😮, 🎉)
- **Real-time Broadcast**: Reactions appear to all participants instantly

### 6. Waiting Room
- **Host Control**: Hosts can approve/reject participants
- **Request Notification**: Hosts receive notifications when users join waiting room
- **Approve/Reject**: Quick actions to manage waiting room participants

### 7. Recording
- **Start/Stop Recording**: Toggle meeting recording
- **Recording Status**: Visual indicator when recording is active
- **Server Integration**: Recording state synchronized with server

### 8. Settings
- **Audio/Video Controls**: Quick access to toggle camera and microphone
- **Settings Panel**: Dedicated settings dialog

## UI Components

### Home Screen
- Create new rooms
- Join existing rooms
- View scheduled meetings
- QR code generation for room sharing

### Room Screen
- Video grid layout
- Control bar with all meeting features
- Header with room information
- Leave room button

### Scheduled Meetings Screen
- Grid and list view modes
- Meeting cards with details
- Quick actions (edit, delete)
- Meeting details dialog

### Meeting Scheduler Screen
- Form-based meeting creation
- Date and time pickers
- Recurring meeting options
- Duration selection

## Technical Implementation

### Dependencies
- `flutter_webrtc`: WebRTC video/audio streaming
- `socket_io_client`: Real-time communication
- `http`: API communication
- `qr_flutter`: QR code generation
- `permission_handler`: Camera and microphone permissions
- `intl`: Date/time formatting
- `file_picker`: File selection (for future file sharing)
- `path_provider`: File system access
- `fluttertoast`: Toast notifications
- `url_launcher`: URL handling

### Architecture
- Stateful widgets for dynamic UI
- Socket.io for real-time events
- WebRTC for peer connections
- REST API for meeting management

## Future Enhancements

The following features are planned for future implementation:
- Screen sharing
- File sharing
- Live captions
- Meeting transcripts
- Breakout rooms
- Meeting history
- Background noise suppression
- Push-to-talk
- Picture-in-picture mode
- Participant pinning
- Screen annotation
- Connection quality indicator

## API Integration

The mobile app connects to the same backend API as the web application:
- Base URL: `http://localhost:5000`
- Socket.io endpoint: `http://localhost:5000`
- Meeting API: `/api/meetings`
- Room API: `/api/room`

## Permissions

The app requires the following permissions:
- Camera: For video calls
- Microphone: For audio calls
- Internet: For API and socket connections

## Setup Instructions

1. Install Flutter dependencies:
   ```bash
   flutter pub get
   ```

2. Update API URL in `home_screen.dart` and `room_screen.dart` if needed

3. Run the app:
   ```bash
   flutter run
   ```

4. Ensure the backend server is running on `http://localhost:5000`

## Notes

- The app uses localhost for development. Update URLs for production.
- WebRTC requires proper STUN/TURN server configuration for NAT traversal
- Socket.io connection must be established before joining rooms
- All features are synchronized with the web application

