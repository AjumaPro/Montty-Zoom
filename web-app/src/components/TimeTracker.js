import React, { useState, useEffect } from 'react';
import { HiPlay, HiPause, HiStop } from 'react-icons/hi2';
import './TimeTracker.css';

function TimeTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((new Date() - startTime) / 1000);
          setTime(elapsed);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handlePlay = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (time === 0) {
        setStartTime(new Date());
      } else {
        // Resume from where we left off
        setStartTime(new Date() - time * 1000);
      }
    } else {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    setStartTime(null);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="time-tracker">
      <div className="tracker-header">
        <h3 className="tracker-title">Time Tracker</h3>
      </div>
      <div className="tracker-display">
        <div className="time-display">{formatTime(time)}</div>
      </div>
      <div className="tracker-controls">
        <button
          className={`control-btn ${isRunning ? 'pause' : 'play'}`}
          onClick={handlePlay}
        >
          {isRunning ? <HiPause /> : <HiPlay />}
        </button>
        <button className="control-btn stop" onClick={handleStop}>
          <HiStop />
        </button>
      </div>
    </div>
  );
}

export default TimeTracker;

