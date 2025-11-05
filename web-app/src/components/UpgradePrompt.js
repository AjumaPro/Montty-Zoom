import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiXMark, HiSparkles, HiCheckCircle } from 'react-icons/hi2';
import './UpgradePrompt.css';

function UpgradePrompt({ 
  isOpen, 
  onClose, 
  featureName, 
  planName = 'Pro',
  message,
  highlightFeatures = []
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
    if (onClose) onClose();
  };

  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-prompt-close" onClick={onClose}>
          <HiXMark />
        </button>

        <div className="upgrade-prompt-icon">
          <HiSparkles />
        </div>

        <h2 className="upgrade-prompt-title">Unlock {featureName}</h2>
        
        <p className="upgrade-prompt-message">
          {message || `${featureName} is available in the ${planName} plan. Upgrade to unlock this and many more premium features!`}
        </p>

        {highlightFeatures.length > 0 && (
          <div className="upgrade-features-list">
            {highlightFeatures.map((feature, index) => (
              <div key={index} className="upgrade-feature-item">
                <HiCheckCircle className="feature-check-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="upgrade-prompt-actions">
          <button className="upgrade-btn-secondary" onClick={onClose}>
            Maybe Later
          </button>
          <button className="upgrade-btn-primary" onClick={handleUpgrade}>
            Upgrade to {planName}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradePrompt;

