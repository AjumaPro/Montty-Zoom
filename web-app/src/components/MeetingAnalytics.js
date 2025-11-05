import React from 'react';
import './MeetingAnalytics.css';

function MeetingAnalytics({ meetings }) {
  // Generate sample data for last 7 days
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const maxValue = 100;
  
  // Calculate meetings per day (simplified)
  const data = days.map((day, index) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - index));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduledDateTime);
      return meetingDate >= dayStart && meetingDate <= dayEnd;
    }).length;
    
    const height = Math.min((dayMeetings / 10) * 100, 100);
    const isHighlighted = index === 3; // Highlight Wednesday
    
    return { day, height, value: dayMeetings, isHighlighted };
  });

  return (
    <div className="meeting-analytics">
      <div className="analytics-header">
        <h2 className="analytics-title">Meeting Analytics</h2>
      </div>
      <div className="analytics-chart">
        <div className="chart-bars">
          {data.map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div
                  className={`chart-bar ${item.isHighlighted ? 'highlighted' : ''}`}
                  style={{ height: `${item.height}%` }}
                >
                  {item.isHighlighted && (
                    <span className="bar-value">{item.value}</span>
                  )}
                </div>
              </div>
              <span className="bar-label">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MeetingAnalytics;

