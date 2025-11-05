import React, { useEffect, useState } from 'react';
import './ReactionOverlay.css';

const ReactionOverlay = ({ reaction, userName }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="reaction-overlay">
      <div className="reaction-animation">
        <span className="reaction-emoji">{reaction}</span>
        <span className="reaction-user">{userName}</span>
      </div>
    </div>
  );
};

export default ReactionOverlay;

