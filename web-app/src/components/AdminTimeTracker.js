import React, { useState, useEffect } from 'react';
import { HiPlay, HiPause, HiStop } from 'react-icons/hi2';
import './AdminTimeTracker.css';

function AdminTimeTracker() {
  const [time, setTime] = useState({ hours: 1, minutes: 24, seconds: 8 });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          let { hours, minutes, seconds } = prevTime;
          seconds++;
          if (seconds >= 60) {
            seconds = 0;
            minutes++;
            if (minutes >= 60) {
              minutes = 0;
              hours++;
            }
          }
          return { hours, minutes, seconds };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setTime({ hours: 0, minutes: 0, seconds: 0 });
  };

  const formatTime = (value) => String(value).padStart(2, '0');

  return (
    <div className="admin-time-tracker-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Time Tracker</h3>
      </div>
      <div className="admin-time-tracker-content">
        <div className="admin-time-display">
          {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
        </div>
        <div className="admin-time-controls">
          {!isRunning ? (
            <button className="admin-time-btn admin-time-btn-play" onClick={handleStart}>
              <HiPlay />
            </button>
          ) : (
            <button className="admin-time-btn admin-time-btn-pause" onClick={handlePause}>
              <HiPause />
            </button>
          )}
          <button className="admin-time-btn admin-time-btn-stop" onClick={handleStop}>
            <HiStop />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTimeTracker;

