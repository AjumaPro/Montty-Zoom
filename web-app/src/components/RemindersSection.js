import React from 'react';
import { HiVideoCamera } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import './RemindersSection.css';

function RemindersSection({ meetings }) {
  const navigate = useNavigate();
  const now = new Date();
  
  // Find next upcoming meeting
  const upcomingMeeting = meetings
    .filter(m => {
      const meetingDate = new Date(m.scheduledDateTime);
      return meetingDate > now;
    })
    .sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime))[0];

  if (!upcomingMeeting) {
    return (
      <div className="reminders-section">
        <div className="reminders-header">
          <h2 className="reminders-title">Reminders</h2>
        </div>
        <div className="reminders-empty">
          <p>No upcoming meetings</p>
        </div>
      </div>
    );
  }

  const startTime = new Date(upcomingMeeting.scheduledDateTime);
  const endTime = new Date(startTime.getTime() + upcomingMeeting.duration * 60000);
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const handleStartMeeting = () => {
    const userName = localStorage.getItem('userName') || 'User';
    const params = new URLSearchParams({ name: userName });
    if (upcomingMeeting.roomPassword) {
      params.append('password', upcomingMeeting.roomPassword);
    }
    navigate(`/room/${upcomingMeeting.roomId}?${params.toString()}`);
  };

  return (
    <div className="reminders-section">
      <div className="reminders-header">
        <h2 className="reminders-title">Reminders</h2>
      </div>
      <div className="reminders-content">
        <div className="reminder-meeting">
          <h3 className="reminder-title">{upcomingMeeting.title}</h3>
          <p className="reminder-time">
            {formatTime(startTime)} - {formatTime(endTime)}
          </p>
        </div>
        <button className="start-meeting-btn" onClick={handleStartMeeting}>
          <HiVideoCamera />
          Start Meeting
        </button>
      </div>
    </div>
  );
}

export default RemindersSection;

