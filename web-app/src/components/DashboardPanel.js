import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  HiClock,
  HiCalendar,
  HiInformationCircle,
  HiXMark,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiEllipsisHorizontal,
  HiPlus,
  HiArrowRight,
  HiArrowPath
} from 'react-icons/hi2';
import './DashboardPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DashboardPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Load meetings
    loadMeetings();

    // Refresh meetings every minute
    const meetingsInterval = setInterval(loadMeetings, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(meetingsInterval);
    };
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings`);
      setMeetings(response.data);
    } catch (error) {
      // Silently handle errors - don't show toast for background data refresh
      console.log('Error loading meetings (silent):', error.message);
      // Set empty array on error
      setMeetings([]);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTodayMeetings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledDateTime);
      return meetingDate >= today && meetingDate < tomorrow;
    }).sort((a, b) => {
      return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
    });
  };

  const getUpcomingMeetings = () => {
    const now = new Date();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledDateTime);
      return meetingDate >= now;
    }).sort((a, b) => {
      return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
    }).slice(0, 5);
  };

  const formatMeetingTime = (meeting) => {
    const start = new Date(meeting.scheduledDateTime);
    const end = new Date(start.getTime() + meeting.duration * 60000);
    
    const startTime = start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const endTime = end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${startTime} - ${endTime}`;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const todayMeetings = getTodayMeetings();
  const upcomingMeetings = getUpcomingMeetings();

  return (
    <div className="dashboard-panel">
      {/* Time and Date Card */}
      <div className="time-card">
        <div className="time-card-illustration">
          <div className="plant-icon">🌿</div>
        </div>
        <div className="time-card-content">
          <div className="time-display">{formatTime(currentTime)}</div>
          <div className="date-display">{formatDate(currentTime)}</div>
        </div>
        <button className="time-card-menu">
          <HiEllipsisHorizontal />
        </button>
      </div>

      {/* Calendar Connection Prompt */}
      {showCalendarPrompt && (
        <div className="calendar-prompt">
          <HiInformationCircle className="prompt-icon" />
          <div className="prompt-content">
            <p>
              You haven't connected your calendar yet.{' '}
              <button className="prompt-link">Connect now</button>{' '}
              to manage all your meetings and events in one place.
            </p>
          </div>
          <button 
            className="prompt-close"
            onClick={() => setShowCalendarPrompt(false)}
          >
            <HiXMark />
          </button>
        </div>
      )}

      {/* Upcoming Events Section */}
      <div className="events-section">
        <div className="events-header">
          <div className="events-date-header">
            <button className="date-selector">
              Today, {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <HiChevronDown />
            </button>
          </div>
          <div className="events-nav">
            <button className="nav-btn" onClick={goToToday}>Today</button>
            <button className="nav-btn" onClick={() => navigateDate(-1)}>
              <HiChevronLeft />
            </button>
            <button className="nav-btn" onClick={() => navigateDate(1)}>
              <HiChevronRight />
            </button>
            <button className="nav-btn">
              <HiEllipsisHorizontal />
            </button>
            <button className="nav-btn add-event-btn" title="Add event">
              <HiPlus />
            </button>
          </div>
        </div>

        <div className="events-list">
          {todayMeetings.length > 0 ? (
            todayMeetings.map(meeting => (
              <div key={meeting.id} className="event-card">
                <div className="event-main">
                  <h4 className="event-title">{meeting.title}</h4>
                  <div className="event-meta">
                    <span className="event-date">
                      Today, {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <button className="refresh-icon" onClick={loadMeetings}>
                        <HiArrowPath />
                      </button>
                    </span>
                    <span className="event-time">{formatMeetingTime(meeting)}</span>
                    {meeting.participants && meeting.participants.length > 0 && (
                      <span className="event-host">
                        Host: {meeting.participants[0] || 'You'}
                      </span>
                    )}
                  </div>
                </div>
                <button className="event-menu">
                  <HiEllipsisHorizontal />
                </button>
              </div>
            ))
          ) : (
            <div className="no-events">
              <HiCalendar className="no-events-icon" />
              <p>No events scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Open Recordings Section */}
      <div className="recordings-section">
        <button className="recordings-link">
          <span>Open recordings</span>
          <HiArrowRight />
        </button>
      </div>
    </div>
  );
}

export default DashboardPanel;

