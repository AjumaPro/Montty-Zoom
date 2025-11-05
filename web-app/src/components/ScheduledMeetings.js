import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HiCalendar,
  HiClock,
  HiVideoCamera,
  HiTrash,
  HiPencil,
  HiUsers,
  HiBell,
  HiLockClosed,
  HiMagnifyingGlass,
  HiFunnel,
  HiArrowPath,
  HiArrowDownTray,
  HiSquares2X2,
  HiListBullet,
  HiChartBar
} from 'react-icons/hi2';
import './ScheduledMeetings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ScheduledMeetings({ onEditMeeting }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const remindedMeetings = useRef(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'calendar', 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'upcoming', 'active', 'past'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadMeetings();
    // Refresh meetings every minute
    const interval = setInterval(loadMeetings, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      meetings.forEach(meeting => {
        if (!meeting.reminderTime || remindedMeetings.current.has(meeting.id)) {
          return;
        }

        const meetingTime = new Date(meeting.scheduledDateTime);
        const timeDiff = meetingTime.getTime() - now.getTime();
        const reminderMinutes = meeting.reminderTime * 60000;
        
        // Check if it's time to show reminder (within 2 minute window before reminder time)
        if (timeDiff > 0 && timeDiff <= (reminderMinutes + 120000)) {
          const minutesUntilMeeting = Math.floor(timeDiff / 60000);
          const reminderText = meeting.reminderTime >= 1440 
            ? '1 day' 
            : meeting.reminderTime >= 60
              ? `${Math.floor(meeting.reminderTime / 60)} hour${Math.floor(meeting.reminderTime / 60) > 1 ? 's' : ''}`
              : `${meeting.reminderTime} minute${meeting.reminderTime > 1 ? 's' : ''}`;
          
          const message = minutesUntilMeeting > meeting.reminderTime
            ? `🔔 Reminder: "${meeting.title}" in ${reminderText}`
            : `🔔 Reminder: "${meeting.title}" starts in ${minutesUntilMeeting} minute${minutesUntilMeeting !== 1 ? 's' : ''}!`;
          
          remindedMeetings.current.add(meeting.id);
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Meeting Reminder: ${meeting.title}`, {
              body: message.replace('🔔 Reminder: ', ''),
              icon: '/logo192.png',
              tag: meeting.id
            });
          }
          
          toast.info(
            message,
            {
              autoClose: 15000,
              onClick: () => {
                const params = new URLSearchParams({ name: 'Host' });
                if (meeting.roomPassword) {
                  params.append('password', meeting.roomPassword);
                }
                navigate(`/room/${meeting.roomId}?${params.toString()}`);
              }
            }
          );
        }
      });
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (meetings.length > 0) {
      checkReminders();
      // Check reminders every 30 seconds
      const reminderInterval = setInterval(checkReminders, 30000);
      return () => clearInterval(reminderInterval);
    }
  }, [meetings, navigate]);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings`);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/meetings/${meetingId}`);
      loadMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const joinMeeting = (meeting) => {
    const params = new URLSearchParams({ name: 'Host' });
    if (meeting.roomPassword) {
      params.append('password', meeting.roomPassword);
    }
    navigate(`/room/${meeting.roomId}?${params.toString()}`);
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const meetingTime = new Date(meeting.scheduledDateTime);
    const endTime = new Date(meetingTime.getTime() + meeting.duration * 60000);

    if (now < meetingTime) {
      return 'upcoming';
    } else if (now >= meetingTime && now <= endTime) {
      return 'active';
    } else {
      return 'past';
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    // Status filter
    if (statusFilter !== 'all') {
      const status = getMeetingStatus(meeting);
      if (statusFilter === 'upcoming' && status !== 'upcoming') return false;
      if (statusFilter === 'active' && status !== 'active') return false;
      if (statusFilter === 'past' && status !== 'past') return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        meeting.title.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query) ||
        meeting.participants?.some(p => p.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const upcomingMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'upcoming');
  const activeMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'active');
  const pastMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'past');

  // Export to iCal
  const exportToICal = () => {
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Montty Zoom//Meeting Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    filteredMeetings.forEach(meeting => {
      const startDate = new Date(meeting.scheduledDateTime);
      const endDate = new Date(startDate.getTime() + meeting.duration * 60000);
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${meeting.id}@monttyzoom.com`);
      icalContent.push(`DTSTART:${formatDate(startDate)}`);
      icalContent.push(`DTEND:${formatDate(endDate)}`);
      icalContent.push(`SUMMARY:${meeting.title}`);
      if (meeting.description) {
        icalContent.push(`DESCRIPTION:${meeting.description}`);
      }
      if (meeting.participants && meeting.participants.length > 0) {
        icalContent.push(`ATTENDEE:${meeting.participants.join(';')}`);
      }
      icalContent.push('END:VEVENT');
    });

    icalContent.push('END:VCALENDAR');

    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'montty-zoom-meetings.ics';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendar exported successfully!');
  };

  // Get meeting statistics
  const getStatistics = () => {
    return {
      total: meetings.length,
      upcoming: upcomingMeetings.length,
      active: activeMeetings.length,
      past: pastMeetings.length,
      withReminders: meetings.filter(m => m.reminderTime).length,
      withPassword: meetings.filter(m => m.roomPassword).length
    };
  };

  const stats = getStatistics();

  // Calendar view helper
  const getMeetingsForMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledDateTime);
      return meetingDate >= firstDay && meetingDate <= lastDay;
    });
  };

  const renderCalendarView = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthMeetings = getMeetingsForMonth();
    const meetingsByDate = {};
    monthMeetings.forEach(meeting => {
      const date = new Date(meeting.scheduledDateTime).getDate();
      if (!meetingsByDate[date]) meetingsByDate[date] = [];
      meetingsByDate[date].push(meeting);
    });

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const dayMeetings = meetingsByDate[day] || [];
      
      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${dayMeetings.length > 0 ? 'has-meetings' : ''}`}>
          <div className="calendar-day-number">{day}</div>
          {dayMeetings.length > 0 && (
            <div className="calendar-day-meetings">
              {dayMeetings.slice(0, 3).map(meeting => (
                <div key={meeting.id} className="calendar-meeting-dot" title={meeting.title}></div>
              ))}
              {dayMeetings.length > 3 && (
                <div className="calendar-meeting-more">+{dayMeetings.length - 3}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))} className="calendar-nav-btn">
            ← Prev
          </button>
          <h3>{monthNames[month]} {year}</h3>
          <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))} className="calendar-nav-btn">
            Next →
          </button>
        </div>
        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="meetings-loading">Loading meetings...</div>;
  }

  const renderMeetingCard = (meeting) => {
    const status = getMeetingStatus(meeting);
    const isUpcoming = status === 'upcoming';
    const isActive = status === 'active';

    return (
      <div key={meeting.id} className={`meeting-card ${status}`}>
        <div className="meeting-card-header">
          <h3 className="meeting-title">{meeting.title}</h3>
          <span className={`meeting-status-badge ${status}`}>
            {status === 'upcoming' && 'Scheduled'}
            {status === 'active' && 'Active Now'}
            {status === 'past' && 'Completed'}
          </span>
        </div>

        {meeting.description && (
          <p className="meeting-description">{meeting.description}</p>
        )}

        <div className="meeting-details">
          <div className="meeting-detail-item">
            <HiCalendar className="detail-icon" />
            <span>{formatDateTime(meeting.scheduledDate, meeting.scheduledTime)}</span>
          </div>
          <div className="meeting-detail-item">
            <HiClock className="detail-icon" />
            <span>{formatTime(meeting.scheduledTime)} • {meeting.duration} min</span>
          </div>
          {meeting.reminderTime && (
            <div className="meeting-detail-item">
              <HiBell className="detail-icon" />
              <span>Reminder: {meeting.reminderTime === 1440 ? '1 day before' : `${meeting.reminderTime} min before`}</span>
            </div>
          )}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="meeting-detail-item">
              <HiUsers className="detail-icon" />
              <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {meeting.roomPassword && (
            <div className="meeting-detail-item">
              <HiLockClosed className="detail-icon" />
              <span>Password protected</span>
            </div>
          )}
        </div>

        <div className="meeting-actions">
          {(isUpcoming || isActive) && (
            <button
              onClick={() => joinMeeting(meeting)}
              className="btn-join-meeting"
            >
              <HiVideoCamera /> {isActive ? 'Join Now' : 'Start Meeting'}
            </button>
          )}
          <button
            onClick={() => onEditMeeting(meeting)}
            className="btn-edit-meeting"
            title="Edit meeting"
          >
            <HiPencil />
          </button>
          <button
            onClick={() => deleteMeeting(meeting.id)}
            className="btn-delete-meeting"
            title="Delete meeting"
          >
            <HiTrash />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="scheduled-meetings">
      {/* Advanced Controls */}
      <div className="meetings-controls">
        <div className="controls-left">
          <div className="search-box">
            <HiMagnifyingGlass className="search-icon" />
            <input
              type="text"
              placeholder="Search meeting"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${showFilters ? 'active' : ''}`}
          >
            <HiFunnel /> Filters
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Meetings</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
          </select>
        </div>
        
        <div className="controls-right">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <HiSquares2X2 />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              title="Calendar View"
            >
              <HiCalendar />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
            >
              <HiListBullet />
            </button>
          </div>
          <button onClick={exportToICal} className="export-btn" title="Export to iCal">
            <HiArrowDownTray /> Export
          </button>
          <button onClick={loadMeetings} className="refresh-btn" title="Refresh">
            <HiArrowPath />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="meetings-content-area">
      {/* Statistics */}
      {meetings.length > 0 && (
        <div className="meetings-statistics">
          <div className="stat-item">
            <HiChartBar className="stat-icon" />
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-item">
            <HiCalendar className="stat-icon" />
            <div>
              <div className="stat-value">{stats.upcoming}</div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>
          <div className="stat-item">
            <HiVideoCamera className="stat-icon" />
            <div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-item">
            <HiBell className="stat-icon" />
            <div>
              <div className="stat-value">{stats.withReminders}</div>
              <div className="stat-label">With Reminders</div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && renderCalendarView()}

      {/* Grid/List View */}
      {viewMode !== 'calendar' && (
        <>
          {activeMeetings.length > 0 && (
            <div className="meetings-section">
              <h2 className="meetings-section-title">Active Meetings</h2>
              <div className={viewMode === 'list' ? 'meetings-list' : 'meetings-grid'}>
                {activeMeetings.map(renderMeetingCard)}
              </div>
            </div>
          )}

          {upcomingMeetings.length > 0 && (
            <div className="meetings-section">
              <h2 className="meetings-section-title">Upcoming Meetings</h2>
              <div className={viewMode === 'list' ? 'meetings-list' : 'meetings-grid'}>
                {upcomingMeetings.map(renderMeetingCard)}
              </div>
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div className="meetings-section">
              <h2 className="meetings-section-title">Past Meetings</h2>
              <div className={viewMode === 'list' ? 'meetings-list' : 'meetings-grid'}>
                {pastMeetings.map(renderMeetingCard)}
              </div>
            </div>
          )}
        </>
      )}

      {filteredMeetings.length === 0 && meetings.length > 0 && (
        <div className="no-meetings">
          <HiMagnifyingGlass className="no-meetings-icon" />
          <p>No meetings match your filters</p>
          <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      )}

      {meetings.length === 0 && (
        <div className="no-meetings">
          <HiCalendar className="no-meetings-icon" />
          <p>No scheduled meetings yet</p>
          <p className="no-meetings-subtitle">Schedule a meeting to get started!</p>
        </div>
      )}
      </div>
    </div>
  );
}

export default ScheduledMeetings;

