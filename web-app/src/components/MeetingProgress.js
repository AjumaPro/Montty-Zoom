import React from 'react';
import './MeetingProgress.css';

function MeetingProgress({ meetings }) {
  const now = new Date();
  
  const ended = meetings.filter(m => {
    const end = new Date(new Date(m.scheduledDateTime).getTime() + m.duration * 60000);
    return end < now;
  }).length;
  
  const inProgress = meetings.filter(m => {
    const start = new Date(m.scheduledDateTime);
    const end = new Date(start.getTime() + m.duration * 60000);
    return start <= now && end >= now;
  }).length;
  
  const pending = meetings.filter(m => {
    const start = new Date(m.scheduledDateTime);
    return start > now;
  }).length;
  
  const total = meetings.length;
  const completedPercentage = total > 0 ? Math.round((ended / total) * 100) : 0;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (completedPercentage / 100) * circumference;

  return (
    <div className="meeting-progress">
      <div className="progress-header">
        <h2 className="progress-title">Meeting Progress</h2>
      </div>
      <div className="progress-content">
        <div className="progress-circle-container">
          <svg className="progress-circle" width="160" height="160">
            <circle
              className="progress-circle-bg"
              cx="80"
              cy="80"
              r="70"
              fill="none"
              strokeWidth="20"
            />
            <circle
              className="progress-circle-fill"
              cx="80"
              cy="80"
              r="70"
              fill="none"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="progress-center">
            <div className="progress-percentage">{completedPercentage}%</div>
            <div className="progress-label">Meetings Ended</div>
          </div>
        </div>
        <div className="progress-legend">
          <div className="legend-item">
            <div className="legend-color completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-color in-progress"></div>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-color pending"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingProgress;

