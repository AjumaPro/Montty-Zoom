import React, { useState, useEffect, useRef } from 'react';
import { HiVideoCamera, HiVideoCameraSlash, HiMicrophone, HiSpeakerXMark, HiCheck, HiXMark } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './MeetingLobby.css';

function MeetingLobby({ userName, roomId, onJoin, onCancel, roomPassword }) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoStream, setVideoStream] = useState(null);
  const [audioTest, setAudioTest] = useState(false);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
        setVideoStream(stream);
      }
    } catch (error) {
      console.error('Error accessing media:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const cleanup = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('Error closing AudioContext:', error);
      }
    }
  };

  const toggleVideo = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (videoStream) {
      const audioTrack = videoStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const testAudio = async () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        
        if (videoStream) {
          const audioTrack = videoStream.getAudioTracks()[0];
          const source = audioContextRef.current.createMediaStreamSource(new MediaStream([audioTrack]));
          source.connect(analyserRef.current);
        }
      }
      setAudioTest(true);
      setTimeout(() => setAudioTest(false), 2000);
    } catch (error) {
      console.error('Error testing audio:', error);
    }
  };

  const handleJoin = () => {
    cleanup();
    onJoin({ videoEnabled, audioEnabled });
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  return (
    <div className="meeting-lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <h2>Join Meeting</h2>
          <p className="room-id">Room: {roomId}</p>
        </div>

        <div className="lobby-preview">
          <div className="video-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="preview-video"
            />
            {!videoEnabled && (
              <div className="preview-placeholder">
                <HiVideoCameraSlash />
                <p>Camera Off</p>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-controls">
          <button
            onClick={toggleVideo}
            className={`lobby-control-btn ${videoEnabled ? 'active' : ''}`}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <HiVideoCamera /> : <HiVideoCameraSlash />}
          </button>
          <button
            onClick={toggleAudio}
            className={`lobby-control-btn ${audioEnabled ? 'active' : ''}`}
            title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {audioEnabled ? <HiMicrophone /> : <HiSpeakerXMark />}
          </button>
          <button
            onClick={testAudio}
            className={`lobby-control-btn ${audioTest ? 'testing' : ''}`}
            title="Test audio"
          >
            🔊
          </button>
        </div>

        <div className="lobby-info">
          <p><strong>Name:</strong> {userName}</p>
          {roomPassword && <p><strong>Room:</strong> Password Protected</p>}
        </div>

        <div className="lobby-actions">
          <button onClick={handleCancel} className="btn-cancel">
            <HiXMark /> Cancel
          </button>
          <button onClick={handleJoin} className="btn-join">
            <HiCheck /> Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeetingLobby;

