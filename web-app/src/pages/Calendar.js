import React, { useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi2';
import axios from 'axios';
import './Calendar.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  React.useEffect(() => {
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getMeetingsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledDateTime).toISOString().split('T')[0];
      return meetingDate === dateStr;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">View and manage your scheduled meetings</p>
        </div>
        <div className="calendar-controls">
          <button className="btn-secondary" onClick={goToToday}>Today</button>
          <button className="btn-primary">
            <HiPlus />
            Add Meeting
          </button>
        </div>
      </div>

      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>
          <HiChevronLeft />
        </button>
        <h2 className="current-month">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button className="nav-btn" onClick={nextMonth}>
          <HiChevronRight />
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((date, index) => {
            const dateMeetings = getMeetingsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
            
            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    {dateMeetings.length > 0 && (
                      <div className="day-meetings">
                        {dateMeetings.slice(0, 3).map(meeting => (
                          <div key={meeting.id} className="meeting-dot" title={meeting.title}></div>
                        ))}
                        {dateMeetings.length > 3 && (
                          <div className="more-meetings">+{dateMeetings.length - 3}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-meetings">
          <h3>Meetings on {selectedDate.toLocaleDateString()}</h3>
          {getMeetingsForDate(selectedDate).length > 0 ? (
            <div className="meetings-list">
              {getMeetingsForDate(selectedDate).map(meeting => (
                <div key={meeting.id} className="meeting-item">
                  <div className="meeting-time">
                    {new Date(meeting.scheduledDateTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="meeting-info">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-duration">{meeting.duration} minutes</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-meetings">No meetings scheduled for this date</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Calendar;

