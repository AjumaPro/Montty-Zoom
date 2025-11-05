const { spawn } = require('child_process');
const logger = require('./logger');

class StreamingService {
  constructor() {
    this.activeStreams = new Map(); // roomId -> streamInfo
  }

  /**
   * Check if FFmpeg is installed
   */
  async checkFFmpegInstalled() {
    return new Promise((resolve) => {
      const checkProcess = spawn('ffmpeg', ['-version']);
      checkProcess.on('close', (code) => {
        resolve(code === 0);
      });
      checkProcess.on('error', () => {
        resolve(false);
      });
      // Timeout after 2 seconds
      setTimeout(() => {
        checkProcess.kill();
        resolve(false);
      }, 2000);
    });
  }

  /**
   * Build RTMP URL with stream key
   * Handles YouTube and other platforms correctly
   */
  buildRTMPUrl(rtmpUrl, streamKey) {
    if (!streamKey) {
      return rtmpUrl;
    }

    // YouTube specific format: rtmp://a.rtmp.youtube.com/live2/{stream_key}
    if (rtmpUrl.includes('youtube.com') || rtmpUrl.includes('youtu.be')) {
      if (rtmpUrl.endsWith('/live2')) {
        return `${rtmpUrl}/${streamKey}`;
      } else if (rtmpUrl.endsWith('/live2/')) {
        return `${rtmpUrl}${streamKey}`;
      } else {
        // Default YouTube format
        return `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
      }
    }

    // Facebook: rtmp://rtmp-api.facebook.com:80/rtmp/{stream_key}
    if (rtmpUrl.includes('facebook.com')) {
      if (rtmpUrl.endsWith('/rtmp')) {
        return `${rtmpUrl}/${streamKey}`;
      } else if (rtmpUrl.endsWith('/rtmp/')) {
        return `${rtmpUrl}${streamKey}`;
      }
    }

    // Twitch: rtmp://live.twitch.tv/app/{stream_key}
    if (rtmpUrl.includes('twitch.tv')) {
      if (rtmpUrl.endsWith('/app')) {
        return `${rtmpUrl}/${streamKey}`;
      } else if (rtmpUrl.endsWith('/app/')) {
        return `${rtmpUrl}${streamKey}`;
      }
    }

    // Generic fallback
    if (rtmpUrl.includes('?rtmp://')) {
      return rtmpUrl.replace('?rtmp://', `/${streamKey}?rtmp://`);
    } else if (rtmpUrl.endsWith('/')) {
      return `${rtmpUrl}${streamKey}`;
    } else {
      return `${rtmpUrl}/${streamKey}`;
    }
  }

  /**
   * Start streaming meeting to RTMP endpoint
   * @param {string} roomId - Room ID
   * @param {string} rtmpUrl - RTMP URL (YouTube, Facebook, Twitch, etc.)
   * @param {string} streamKey - Stream key (if needed)
   * @param {object} options - Streaming options
   */
  async startStreaming(roomId, rtmpUrl, streamKey = null, options = {}) {
    try {
      // Check if FFmpeg is installed
      const ffmpegInstalled = await this.checkFFmpegInstalled();
      if (!ffmpegInstalled) {
        const error = new Error('FFmpeg is not installed. Please install FFmpeg to enable live streaming.\n\nInstallation:\n- macOS: brew install ffmpeg\n- Ubuntu/Debian: sudo apt-get install ffmpeg\n- Windows: Download from https://ffmpeg.org/download.html');
        logger.error('FFmpeg not found', { roomId });
        throw error;
      }

      // Build RTMP URL with stream key
      const fullRtmpUrl = this.buildRTMPUrl(rtmpUrl, streamKey);
      
      logger.info(`Starting stream for room ${roomId}`, { 
        roomId, 
        rtmpUrl: fullRtmpUrl,
        platform: this.detectPlatform(rtmpUrl),
        hasStreamKey: !!streamKey
      });

      // FFmpeg command for RTMP streaming
      // Note: Currently uses test video source. For production, you'd need to capture the meeting video stream
      // This is a placeholder implementation that will show a test pattern on YouTube
      const ffmpegArgs = [
        '-f', 'lavfi',
        '-i', 'testsrc2=size=1280x720:rate=30', // Test source (replace with actual video source)
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', // Audio source
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-maxrate', '3000k',
        '-bufsize', '6000k',
        '-pix_fmt', 'yuv420p',
        '-g', '50',
        '-c:a', 'aac',
        '-b:a', '160k',
        '-ar', '44100',
        '-f', 'flv',
        '-flvflags', 'no_duration_filesize',
        fullRtmpUrl
      ];

      logger.info(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`, { roomId });

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      const streamInfo = {
        roomId,
        rtmpUrl: fullRtmpUrl,
        platform: this.detectPlatform(rtmpUrl),
        process: ffmpegProcess,
        startedAt: new Date(),
        status: 'streaming'
      };

      let stderrBuffer = '';

      ffmpegProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug(`FFmpeg stdout: ${output}`, { roomId });
      });

      ffmpegProcess.stderr.on('data', (data) => {
        // FFmpeg writes to stderr, but it's not necessarily an error
        const output = data.toString();
        stderrBuffer += output;
        
        // Log important messages
        if (output.includes('Connection to') || output.includes('Streaming')) {
          logger.info(`FFmpeg: ${output.trim()}`, { roomId });
        }
        
        // Check for errors
        if (output.includes('error') || output.includes('Error') || output.includes('Failed')) {
          logger.error(`FFmpeg error output: ${output}`, { roomId });
        }
      });

      ffmpegProcess.on('close', (code) => {
        logger.info(`FFmpeg process exited with code ${code}`, { roomId });
        if (code !== 0 && code !== 255) {
          logger.error(`FFmpeg exited with error code ${code}. Last output: ${stderrBuffer.slice(-500)}`, { roomId });
        }
        this.activeStreams.delete(roomId);
      });

      ffmpegProcess.on('error', (error) => {
        logger.error('FFmpeg process error:', error, { roomId });
        this.activeStreams.delete(roomId);
        throw error;
      });

      // Wait a bit to see if FFmpeg starts successfully
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('FFmpeg process failed to start within 5 seconds'));
        }, 5000);

        ffmpegProcess.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // Check if process is still running after 1 second
        setTimeout(() => {
          if (ffmpegProcess.killed || ffmpegProcess.exitCode !== null) {
            clearTimeout(timeout);
            reject(new Error('FFmpeg process exited immediately'));
          } else {
            clearTimeout(timeout);
            resolve();
          }
        }, 1000);
      });

      this.activeStreams.set(roomId, streamInfo);
      logger.info(`Streaming started successfully for room ${roomId}`, { 
        roomId, 
        platform: streamInfo.platform,
        rtmpUrl: fullRtmpUrl 
      });

      return streamInfo;
    } catch (error) {
      logger.error('Error starting stream:', error, { roomId });
      throw error;
    }
  }

  /**
   * Stop streaming for a room
   */
  async stopStreaming(roomId) {
    const streamInfo = this.activeStreams.get(roomId);
    if (!streamInfo) {
      throw new Error('No active stream found for this room');
    }

    try {
      if (streamInfo.process) {
        streamInfo.process.kill('SIGTERM');
      }
      this.activeStreams.delete(roomId);
      logger.info(`Streaming stopped for room ${roomId}`, { roomId });
      return true;
    } catch (error) {
      logger.error('Error stopping stream:', error, { roomId });
      throw error;
    }
  }

  /**
   * Get streaming status for a room
   */
  getStreamStatus(roomId) {
    const streamInfo = this.activeStreams.get(roomId);
    if (!streamInfo) {
      return { isStreaming: false };
    }

    return {
      isStreaming: true,
      platform: streamInfo.platform,
      startedAt: streamInfo.startedAt,
      rtmpUrl: streamInfo.rtmpUrl
    };
  }

  /**
   * Detect platform from RTMP URL
   */
  detectPlatform(rtmpUrl) {
    if (rtmpUrl.includes('youtube.com') || rtmpUrl.includes('youtu.be')) {
      return 'YouTube';
    } else if (rtmpUrl.includes('facebook.com')) {
      return 'Facebook';
    } else if (rtmpUrl.includes('twitch.tv')) {
      return 'Twitch';
    } else if (rtmpUrl.includes('instagram.com')) {
      return 'Instagram';
    } else {
      return 'Custom';
    }
  }

  /**
   * Generate YouTube Live RTMP URL
   * Note: Requires YouTube Data API v3 credentials
   */
  async generateYouTubeRTMPUrl(accessToken, title, description) {
    // This would typically use YouTube Data API v3
    // For now, return the standard YouTube RTMP format
    // rtmp://a.rtmp.youtube.com/live2/{stream_key}
    return {
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      instructions: 'Use your YouTube Live stream key'
    };
  }

  /**
   * Get all active streams
   */
  getAllActiveStreams() {
    return Array.from(this.activeStreams.values()).map(stream => ({
      roomId: stream.roomId,
      platform: stream.platform,
      startedAt: stream.startedAt,
      status: stream.status
    }));
  }
}

module.exports = new StreamingService();

