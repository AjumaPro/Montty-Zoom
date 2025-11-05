import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiSparkles, HiXMark } from 'react-icons/hi2';
import './UpgradeBanner.css';

function UpgradeBanner({ 
  featureName, 
  planName = 'Pro',
  onDismiss,
  dismissible = true 
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (dismissed) return null;

  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-content">
        <div className="upgrade-banner-icon">
          <HiSparkles />
        </div>
        <div className="upgrade-banner-text">
          <strong>{featureName}</strong> is available in the <strong>{planName}</strong> plan
        </div>
        <button className="upgrade-banner-btn" onClick={handleUpgrade}>
          Upgrade Now
        </button>
      </div>
      {dismissible && (
        <button className="upgrade-banner-close" onClick={handleDismiss}>
          <HiXMark />
        </button>
      )}
    </div>
  );
}

export default UpgradeBanner;

