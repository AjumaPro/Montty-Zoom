import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const containerClass = fullScreen ? 'loading-spinner-fullscreen' : 'loading-spinner-container';
  
  return (
    <div className={containerClass}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;

