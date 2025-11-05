import React from 'react';
import { HiVideoCamera } from 'react-icons/hi2';
import './AdminReminders.css';

function AdminReminders({ reminders = [] }) {
  const defaultReminder = {
    title: 'Meeting with Arc Company',
    time: '02:00 pm - 04:00 pm',
    date: 'Today'
  };

  const displayReminders = reminders.length > 0 ? reminders : [defaultReminder];

  return (
    <div className="admin-reminders-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Reminders</h3>
      </div>
      <div className="admin-reminders-list">
        {displayReminders.map((reminder, index) => (
          <div key={index} className="admin-reminder-item">
            <div className="admin-reminder-content">
              <div className="admin-reminder-title">{reminder.title}</div>
              <div className="admin-reminder-time">Time: {reminder.time}</div>
            </div>
            <button className="admin-start-meeting-btn">
              <HiVideoCamera />
              Start Meeting
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminReminders;

