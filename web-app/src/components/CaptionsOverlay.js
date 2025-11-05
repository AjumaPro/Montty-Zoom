import React from 'react';
import './CaptionsOverlay.css';

function CaptionsOverlay({ currentCaption, displayedCaptions, enabled }) {
  if (!enabled || (!currentCaption && displayedCaptions.length === 0)) {
    return null;
  }

  return (
    <div className="captions-overlay">
      {currentCaption && (
        <div className="caption-current">
          <div className="caption-text">{currentCaption}</div>
        </div>
      )}
      {displayedCaptions.length > 0 && (
        <div className="captions-history-overlay">
          {displayedCaptions.slice(-3).reverse().map((caption, index) => (
            <div key={index} className="caption-item-overlay">
              <span className="caption-user">{caption.userName}:</span>
              <span className="caption-content">{caption.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CaptionsOverlay;

