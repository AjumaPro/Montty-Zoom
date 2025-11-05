import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiXMark, HiCalendar, HiClock, HiUsers, HiVideoCamera, HiChartBar } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './MeetingHistory.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MeetingHistory({ isOpen, onClose }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/meetings/history`, {
        timeout: 5000 // 5 second timeout
      });
      setMeetings(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error('Error loading meeting history:', error);
      // Only show error toast for server errors (500+), silently handle network/other errors
      if (error.response && error.response.status >= 500) {
        // Server error (500+)
        toast.error('Failed to load meeting history');
      } else {
        // Network error, timeout, or client error - handle silently
        console.log('Meeting history load failed (handled silently):', error.message);
      }
      // Set empty array on error to show "No meeting history available"
      setMeetings([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (meetingsList) => {
    const stats = {
      total: meetingsList.length,
      totalDuration: 0,
      totalParticipants: 0,
      averageDuration: 0,
      averageParticipants: 0,
      byStatus: {
        completed: 0,
        cancelled: 0,
        active: 0
      }
    };

    meetingsList.forEach(meeting => {
      if (meeting.duration) {
        stats.totalDuration += meeting.duration;
      }
      if (meeting.participantsCount) {
        stats.totalParticipants += meeting.participantsCount;
      }
      if (meeting.status) {
        stats.byStatus[meeting.status] = (stats.byStatus[meeting.status] || 0) + 1;
      }
    });

    stats.averageDuration = stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;
    stats.averageParticipants = stats.total > 0 ? Math.round(stats.totalParticipants / stats.total) : 0;

    setStats(stats);
  };

  if (!isOpen) return null;

  return (
    <div className="meeting-history-overlay" onClick={onClose}>
      <div className="meeting-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="meeting-history-header">
          <h2>Meeting History & Analytics</h2>
          <button onClick={onClose} className="close-btn">
            <HiXMark />
          </button>
        </div>

        <div className="meeting-history-content">
          {stats && (
            <div className="stats-section">
              <h3>Overview</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <HiCalendar className="stat-icon" />
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Meetings</div>
                </div>
                <div className="stat-card">
                  <HiClock className="stat-icon" />
                  <div className="stat-value">{stats.averageDuration}m</div>
                  <div className="stat-label">Avg Duration</div>
                </div>
                <div className="stat-card">
                  <HiUsers className="stat-icon" />
                  <div className="stat-value">{stats.averageParticipants}</div>
                  <div className="stat-label">Avg Participants</div>
                </div>
                <div className="stat-card">
                  <HiVideoCamera className="stat-icon" />
                  <div className="stat-value">{stats.byStatus.completed || 0}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>
          )}

          <div className="meetings-list-section">
            <h3>Past Meetings</h3>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : meetings.length === 0 ? (
              <div className="no-meetings">No meeting history available</div>
            ) : (
              <div className="meetings-list">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="meeting-item"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <div className="meeting-info">
                      <div className="meeting-title">{meeting.title || 'Untitled Meeting'}</div>
                      <div className="meeting-meta">
                        <span>{new Date(meeting.createdAt || meeting.scheduledDateTime).toLocaleDateString()}</span>
                        {meeting.duration && <span>{meeting.duration} min</span>}
                        {meeting.participantsCount && <span>{meeting.participantsCount} participants</span>}
                      </div>
                    </div>
                    <div className={`meeting-status ${meeting.status || 'completed'}`}>
                      {meeting.status || 'completed'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMeeting && (
            <div className="meeting-details">
              <h4>{selectedMeeting.title || 'Untitled Meeting'}</h4>
              <div className="details-grid">
                <div>
                  <strong>Date:</strong> {new Date(selectedMeeting.createdAt || selectedMeeting.scheduledDateTime).toLocaleString()}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedMeeting.duration || 'N/A'} minutes
                </div>
                <div>
                  <strong>Participants:</strong> {selectedMeeting.participantsCount || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> {selectedMeeting.status || 'completed'}
                </div>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="close-details-btn">
                Close Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingHistory;

