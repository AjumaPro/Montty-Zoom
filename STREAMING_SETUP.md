# Live Streaming Setup Guide

This guide will help you set up live streaming to YouTube and other platforms.

## Prerequisites

### 1. Install FFmpeg

FFmpeg is required for RTMP streaming. Install it based on your operating system:

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

#### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add FFmpeg to your system PATH:
   - Right-click "This PC" → Properties → Advanced System Settings
   - Click "Environment Variables"
   - Under "System Variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click OK to save

#### Verify Installation
After installing, verify FFmpeg is available:
```bash
ffmpeg -version
```

### 2. Get YouTube Stream Key

1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Click "Go Live" → "Stream"
3. Under "Stream settings" → "Stream key", select "Default stream key (RTMP, Variable)"
4. Copy your Stream key (long string like `pday-ydjq-p2uc-f7cu-2q53`)

### 3. Configure Stream Key

You have two options:

#### Option A: Use .env file (Recommended for Development)
Add to your `.env` file in the root directory:
```env
YOUTUBE_RTMP_URL=rtmp://a.rtmp.youtube.com/live2
YOUTUBE_STREAM_KEY=your_stream_key_here
YOUTUBE_BACKUP_RTMP_URL=rtmp://b.rtmp.youtube.com/live2?backup=1
```

#### Option B: Use Settings UI (Recommended for Production)
1. Go to Settings → Social Media Accounts
2. Click "Manage Accounts"
3. Click "Add Account"
4. Fill in:
   - Account Name: e.g., "My YouTube Channel"
   - Platform: Select "YouTube Live"
   - RTMP URL: `rtmp://a.rtmp.youtube.com/live2` (auto-filled)
   - Stream Key: Paste your YouTube stream key
5. Click "Save Account"

## Starting a Live Stream

### Method 1: Quick Start (YouTube Live)
1. Click "Stream on Social Media" from the dashboard
2. Click "Start YouTube Live"
3. If not in a meeting, a meeting will be created automatically
4. The stream will start using your configured stream key

### Method 2: Manual Setup
1. Join or create a meeting
2. Click "Live Streaming" button (host only)
3. Select platform or enter custom RTMP URL
4. Enter stream key if required
5. Click "Start Streaming"

## Troubleshooting

### Stream Doesn't Show on YouTube

1. **Check FFmpeg Installation**
   - Run `ffmpeg -version` in terminal
   - If not found, install FFmpeg (see above)

2. **Verify Stream Key**
   - Ensure your stream key is correct
   - Check YouTube Studio → Go Live → Stream settings
   - Regenerate key if needed

3. **Check Server Logs**
   - Check `logs/error.log` for FFmpeg errors
   - Look for connection errors or authentication failures

4. **Test RTMP URL**
   - Ensure RTMP URL is correct: `rtmp://a.rtmp.youtube.com/live2/{stream_key}`
   - Try backup server: `rtmp://b.rtmp.youtube.com/live2/{stream_key}`

5. **YouTube Studio Status**
   - In YouTube Studio, check if stream shows as "Live" or "Waiting"
   - If "Waiting", the stream is connecting but may take 10-30 seconds

### Common Issues

**Error: "FFmpeg is not installed"**
- Install FFmpeg using the instructions above
- Restart the server after installation

**Error: "Stream key is required"**
- Configure stream key in Settings → Social Media Accounts
- Or add `YOUTUBE_STREAM_KEY` to `.env` file

**Stream connects but shows test pattern**
- This is expected behavior - the current implementation uses a test video source
- To stream actual meeting video, the WebRTC stream needs to be captured and fed into FFmpeg (advanced)

**Stream disconnects immediately**
- Check network connectivity
- Verify RTMP URL format
- Check server logs for detailed error messages

## Current Limitations

- **Test Video Source**: Currently streams a test pattern instead of actual meeting video
- **Single Stream**: Only one stream per meeting
- **No Recording**: Streaming and recording are separate (can be enabled together)

## Next Steps

For production use, you'll need to:
1. Capture the WebRTC video stream from the meeting
2. Convert it to a format FFmpeg can process
3. Feed it into the FFmpeg pipeline for RTMP streaming

This requires more advanced WebRTC and FFmpeg integration.

