import React, { useEffect, useRef, useState } from 'react';
import './VoiceActivityIndicator.css';

const VoiceActivityIndicator = ({ stream, userId, isLocal = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId = null;

    analyser.fftSize = 256;
    microphone.connect(analyser);
    analyserRef.current = analyser;

    const checkAudioLevel = () => {
      if (audioContext.state === 'closed') return;
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setIsSpeaking(average > 30); // Threshold for speaking
      animationFrameId = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (error) {
          console.warn('Error closing AudioContext:', error);
        }
      }
    };
  }, [stream]);

  if (!isSpeaking) return null;

  return (
    <div className={`voice-indicator ${isLocal ? 'local' : ''}`}>
      <div className="voice-pulse"></div>
      <span className="voice-icon">🎤</span>
    </div>
  );
};

export default VoiceActivityIndicator;

