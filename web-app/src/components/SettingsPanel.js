import React, { useState } from 'react';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose, onVideoQualityChange, currentQuality }) => {
  const [quality, setQuality] = useState(currentQuality || 'auto');

  const qualities = [
    { value: 'auto', label: 'Auto (Recommended)' },
    { value: 'low', label: 'Low (240p)' },
    { value: 'medium', label: 'Medium (480p)' },
    { value: 'high', label: 'High (720p)' },
    { value: 'ultra', label: 'Ultra (1080p)' }
  ];

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (onVideoQualityChange) {
      onVideoQualityChange(newQuality);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button onClick={onClose} className="settings-close-btn">×</button>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h4>Video Quality</h4>
            <div className="quality-options">
              {qualities.map((q) => (
                <label key={q.value} className="quality-option">
                  <input
                    type="radio"
                    name="quality"
                    value={q.value}
                    checked={quality === q.value}
                    onChange={() => handleQualityChange(q.value)}
                  />
                  <span>{q.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <h4>Tips</h4>
            <ul className="settings-tips">
              <li>Use "Auto" for best experience</li>
              <li>Lower quality uses less bandwidth</li>
              <li>Higher quality requires faster internet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

