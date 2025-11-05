import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiVideoCamera, HiMicrophone, HiStop, HiPlay } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './RecordingControls.css';

function RecordingControls() {
  const navigate = useNavigate();
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const videoRecorderRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const audioChunksRef = useRef([]);

  // Get supported MIME type
  const getSupportedMimeType = (isVideo = true) => {
    const types = isVideo 
      ? [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm',
          'video/mp4'
        ]
      : [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4'
        ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    // Fallback to default
    return isVideo ? 'video/webm' : 'audio/webm';
  };

  const startVideoRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error('MediaRecorder is not supported in your browser');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      const mimeType = getSupportedMimeType(true);
      const options = { mimeType };
      
      const recorder = new MediaRecorder(stream, options);

      videoChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        toast.error('Recording error occurred');
        setIsRecordingVideo(false);
      };

      recorder.onstop = () => {
        if (videoChunksRef.current.length === 0) {
          toast.error('No recording data captured');
          return;
        }

        const blob = new Blob(videoChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Video recording saved!');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        videoChunksRef.current = [];
      };

      // Start recording with timeslice for better compatibility
      recorder.start(1000); // Collect data every second
      videoRecorderRef.current = recorder;
      setIsRecordingVideo(true);
      toast.info('Video recording started');
    } catch (error) {
      console.error('Error starting video recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No screen or window available to share');
      } else {
        toast.error('Failed to start video recording: ' + error.message);
      }
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
      toast.info('Video recording stopped');
    }
  };

  const startAudioRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error('MediaRecorder is not supported in your browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mimeType = getSupportedMimeType(false);
      const options = { mimeType };
      
      const recorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        toast.error('Recording error occurred');
        setIsRecordingAudio(false);
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.error('No recording data captured');
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Audio recording saved!');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        audioChunksRef.current = [];
      };

      // Start recording with timeslice for better compatibility
      recorder.start(1000); // Collect data every second
      audioRecorderRef.current = recorder;
      setIsRecordingAudio(true);
      toast.info('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found');
      } else {
        toast.error('Failed to start audio recording: ' + error.message);
      }
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
      setIsRecordingAudio(false);
      toast.info('Audio recording stopped');
    }
  };

  const handleStartMeeting = async () => {
    const userName = localStorage.getItem('userName') || 'User';
    if (!userName.trim()) {
      toast.error('Please enter your name in settings');
      return;
    }
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const userId = localStorage.getItem('userId');
      
      const response = await fetch(`${API_URL}/api/room/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userId || ''
        },
        body: JSON.stringify({
          userId: userId || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting room');
      }

      const room = await response.json();
      
      if (!room.roomId) {
        throw new Error('Invalid room data received');
      }

      const params = new URLSearchParams({ name: userName, autoStart: 'true' });
      if (room.password) {
        params.append('password', room.password);
      }
      navigate(`/room/${room.roomId}?${params.toString()}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Failed to create meeting room');
    }
  };

  return (
    <div className="recording-controls">
      <div className="controls-header">
        <h3 className="controls-title">Recording</h3>
      </div>
      <div className="controls-buttons">
        <button
          className="record-btn start-meeting"
          onClick={handleStartMeeting}
          title="Start Meeting"
        >
          <HiPlay className="btn-icon" />
          <span>Start Meeting</span>
        </button>
        
        <button
          className={`record-btn ${isRecordingVideo ? 'recording' : ''}`}
          onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
          title={isRecordingVideo ? 'Stop Video Recording' : 'Start Video Recording'}
        >
          {isRecordingVideo ? (
            <>
              <HiStop className="btn-icon" />
              <span>Stop Video</span>
            </>
          ) : (
            <>
              <HiVideoCamera className="btn-icon" />
              <span>Record Video</span>
            </>
          )}
        </button>
        
        <button
          className={`record-btn ${isRecordingAudio ? 'recording' : ''} audio`}
          onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
          title={isRecordingAudio ? 'Stop Audio Recording' : 'Start Audio Recording'}
        >
          {isRecordingAudio ? (
            <>
              <HiStop className="btn-icon" />
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <HiMicrophone className="btn-icon" />
              <span>Record Audio</span>
            </>
          )}
        </button>
      </div>
      
      {(isRecordingVideo || isRecordingAudio) && (
        <div className="recording-indicator">
          <div className="pulse-dot"></div>
          <span>Recording in progress...</span>
        </div>
      )}
    </div>
  );
}

export default RecordingControls;

