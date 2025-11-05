import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Analytics.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Analytics() {
  const [meetings, setMeetings] = useState([]);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings`);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const now = new Date();
  const filteredMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduledDateTime);
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return meetingDate >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return meetingDate >= monthAgo;
    } else {
      return true;
    }
  });

  const totalMeetings = filteredMeetings.length;
  const completedMeetings = filteredMeetings.filter(m => {
    const end = new Date(new Date(m.scheduledDateTime).getTime() + m.duration * 60000);
    return end < now;
  }).length;
  const upcomingMeetings = filteredMeetings.filter(m => {
    const start = new Date(m.scheduledDateTime);
    return start > now;
  }).length;
  const totalDuration = filteredMeetings.reduce((sum, m) => sum + (m.duration || 0), 0);
  const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;

  // Calculate meetings by day of week
  const meetingsByDay = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
    return filteredMeetings.filter(m => {
      const meetingDate = new Date(m.scheduledDateTime);
      return meetingDate.getDay() === dayOfWeek;
    }).length;
  });

  const maxMeetings = Math.max(...meetingsByDay, 1);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights into your meeting patterns and statistics</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={`time-range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{totalMeetings}</div>
          <div className="stat-label">Total Meetings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{completedMeetings}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{upcomingMeetings}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{avgDuration}</div>
          <div className="stat-label">Avg Duration (min)</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3 className="chart-title">Meetings by Day of Week</h3>
          <div className="day-chart">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className="day-bar-container">
                <div className="day-bar-wrapper">
                  <div
                    className="day-bar"
                    style={{ height: `${(meetingsByDay[index] / maxMeetings) * 100}%` }}
                  >
                    {meetingsByDay[index] > 0 && (
                      <span className="bar-value">{meetingsByDay[index]}</span>
                    )}
                  </div>
                </div>
                <span className="day-label">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Meeting Distribution</h3>
          <div className="distribution-chart">
            <div className="distribution-item">
              <div className="distribution-bar">
                <div
                  className="distribution-fill completed"
                  style={{ width: `${totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="distribution-label">Completed: {completedMeetings}</div>
            </div>
            <div className="distribution-item">
              <div className="distribution-bar">
                <div
                  className="distribution-fill upcoming"
                  style={{ width: `${totalMeetings > 0 ? (upcomingMeetings / totalMeetings) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="distribution-label">Upcoming: {upcomingMeetings}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

