import React, { useState } from 'react';
import './RecordingsPanel.css';

const RecordingsPanel = ({ isOpen, onClose, recordings, onPlay, onDelete, onDownload }) => {
  const [selectedRecording, setSelectedRecording] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="recordings-panel">
      <div className="recordings-header">
        <h3>Recordings ({recordings.length})</h3>
        <button onClick={onClose} className="recordings-close-btn">×</button>
      </div>
      
      <div className="recordings-list">
        {recordings.length === 0 ? (
          <div className="no-recordings">
            <p>No recordings yet. Start a recording to see it here.</p>
          </div>
        ) : (
          recordings.map((recording, index) => (
            <div key={index} className="recording-item">
              <div className="recording-info">
                <div className="recording-name">
                  {recording.name || `Recording ${index + 1}`}
                </div>
                <div className="recording-meta">
                  <span className="recording-date">
                    {new Date(recording.timestamp).toLocaleString()}
                  </span>
                  <span className="recording-size">
                    {(recording.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="recording-duration">
                    {recording.duration || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="recording-actions">
                <button
                  onClick={() => {
                    setSelectedRecording(selectedRecording === index ? null : index);
                    if (selectedRecording !== index) {
                      onPlay(recording);
                    }
                  }}
                  className="recording-btn play-btn"
                  title="Play"
                >
                  {selectedRecording === index ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => onDownload(recording)}
                  className="recording-btn download-btn"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="recording-btn delete-btn"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
              {selectedRecording === index && recording.blobUrl && (
                <div className="recording-player">
                  <video
                    src={recording.blobUrl}
                    controls
                    className="recording-video"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecordingsPanel;

