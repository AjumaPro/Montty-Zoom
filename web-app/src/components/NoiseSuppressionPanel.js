import React, { useState, useEffect, useRef } from 'react';
import { HiXMark, HiMicrophone, HiSpeakerXMark } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { NoiseSuppressionProcessor } from '../utils/noiseSuppression';
import './NoiseSuppressionPanel.css';

function NoiseSuppressionPanel({ isOpen, onClose, audioStream }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [level, setLevel] = useState(0);
  const processorRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !audioStream) return;

    const setupAudioContext = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const sourceNode = audioContext.createMediaStreamSource(audioStream);
        
        // Create noise suppression processor
        const processor = new NoiseSuppressionProcessor(audioContext, sourceNode);
        processorRef.current = processor;

        // Create analyser for level visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        processor.connect(analyser);
        
        // Start level monitoring
        monitorAudioLevel();
      } catch (error) {
        console.error('Error setting up noise suppression:', error);
        toast.error('Failed to initialize noise suppression');
      }
    };

    setupAudioContext();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch (error) {
          console.warn('Error disconnecting processor:', error);
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('Error closing AudioContext:', error);
        }
      }
    };
  }, [isOpen, audioStream]);

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const toggleNoiseSuppression = () => {
    if (processorRef.current) {
      if (isEnabled) {
        processorRef.current.disable();
        setIsEnabled(false);
        toast.info('Noise suppression disabled');
      } else {
        processorRef.current.enable();
        setIsEnabled(true);
        toast.success('Noise suppression enabled');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="noise-suppression-overlay" onClick={onClose}>
      <div className="noise-suppression-panel" onClick={(e) => e.stopPropagation()}>
        <div className="noise-suppression-header">
          <h2>Background Noise Suppression</h2>
          <button onClick={onClose} className="close-btn">
            <HiXMark />
          </button>
        </div>

        <div className="noise-suppression-content">
          <div className="suppression-status">
            <div className={`status-indicator ${isEnabled ? 'active' : ''}`}>
              {isEnabled ? <HiMicrophone /> : <HiSpeakerXMark />}
            </div>
            <div className="status-text">
              <h3>{isEnabled ? 'Active' : 'Inactive'}</h3>
              <p>{isEnabled ? 'Background noise is being suppressed' : 'Noise suppression is off'}</p>
            </div>
          </div>

          <div className="audio-level-meter">
            <div className="level-bar">
              <div 
                className="level-fill" 
                style={{ width: `${Math.min(level * 2, 100)}%` }}
              />
            </div>
            <span className="level-label">Audio Level</span>
          </div>

          <button
            onClick={toggleNoiseSuppression}
            className={`toggle-btn ${isEnabled ? 'active' : ''}`}
          >
            {isEnabled ? 'Disable' : 'Enable'} Noise Suppression
          </button>

          <div className="info-section">
            <h4>How it works:</h4>
            <ul>
              <li>Uses noise gate to suppress background sounds below threshold</li>
              <li>Applies spectral filtering to reduce low-frequency noise</li>
              <li>Preserves speech quality while removing unwanted noise</li>
              <li>Real-time processing with minimal latency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoiseSuppressionPanel;

