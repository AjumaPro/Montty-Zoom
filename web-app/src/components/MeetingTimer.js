import React, { useState, useEffect } from 'react';
import './MeetingTimer.css';

const MeetingTimer = ({ startedAt }) => {
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startedAt);
      const diff = Math.floor((now - start) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setDuration(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <div className="meeting-timer">
      <span className="timer-icon">⏱️</span>
      <span className="timer-text">{duration}</span>
    </div>
  );
};

export default MeetingTimer;

