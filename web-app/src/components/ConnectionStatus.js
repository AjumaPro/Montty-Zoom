import React from 'react';
import { HiSignal, HiSignalSlash } from 'react-icons/hi2';
import './ConnectionStatus.css';

const ConnectionStatus = ({ isConnected, reconnectAttempts }) => {
  if (isConnected) {
    return (
      <div className="connection-status connected">
        <HiSignal className="status-icon" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="connection-status disconnected">
      <HiSignalSlash className="status-icon" />
      <span>
        {reconnectAttempts > 0 
          ? `Reconnecting... (${reconnectAttempts}/5)`
          : 'Disconnected'
        }
      </span>
    </div>
  );
};

export default ConnectionStatus;

