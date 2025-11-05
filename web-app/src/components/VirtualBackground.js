import React, { useState, useRef, useEffect } from 'react';
import './VirtualBackground.css';

const BACKGROUND_OPTIONS = [
  { type: 'blur', label: 'Blur', icon: '🌫️' },
  { type: 'image', label: 'Beach', icon: '🏖️', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { type: 'image', label: 'Office', icon: '🏢', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800' },
  { type: 'image', label: 'Nature', icon: '🌲', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
  { type: 'none', label: 'None', icon: '❌' }
];

const VirtualBackground = ({ videoRef, stream, onBackgroundChange }) => {
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef(null);
  const backgroundImageRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !stream || selectedBackground === 'none') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const processFrame = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (selectedBackground === 'blur') {
        ctx.filter = 'blur(10px)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
      } else if (selectedBackground === 'image' && backgroundImageRef.current) {
        const bgOption = BACKGROUND_OPTIONS.find(bg => bg.type === 'image' && bg.url);
        if (bgOption) {
          ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
          // Simple chroma key - in production use ML model
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ctx.putImageData(imageData, 0, 0);
        }
      }
      
      requestAnimationFrame(processFrame);
    };

    if (video.readyState >= 2) {
      processFrame();
    }
  }, [videoRef, stream, selectedBackground]);

  const handleBackgroundSelect = (bgType) => {
    setSelectedBackground(bgType);
    if (onBackgroundChange) {
      onBackgroundChange(bgType);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="virtual-bg-toggle"
        title="Virtual Background"
      >
        🎨
      </button>
      {isOpen && (
        <div className="virtual-bg-panel">
          <div className="virtual-bg-header">
            <h4>Virtual Background</h4>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="virtual-bg-options">
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.label}
                onClick={() => handleBackgroundSelect(bg.type)}
                className={`virtual-bg-option ${selectedBackground === bg.type ? 'active' : ''}`}
              >
                <span className="virtual-bg-icon">{bg.icon}</span>
                <span className="virtual-bg-label">{bg.label}</span>
              </button>
            ))}
          </div>
          <p className="virtual-bg-note">Note: Advanced background replacement requires ML models. This is a simplified version.</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {BACKGROUND_OPTIONS.find(bg => bg.type === 'image' && bg.url) && (
        <img
          ref={backgroundImageRef}
          src={BACKGROUND_OPTIONS.find(bg => bg.type === 'image' && bg.url)?.url}
          alt="Background"
          style={{ display: 'none' }}
        />
      )}
    </>
  );
};

export default VirtualBackground;

