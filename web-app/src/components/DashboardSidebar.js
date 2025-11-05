import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HiVideoCamera,
  HiPlus,
  HiCalendar,
  HiArrowUpTray,
  HiChevronDown
} from 'react-icons/hi2';
import JoinRoomModal from './JoinRoomModal';
import ScreenShareModal from './ScreenShareModal';
import './DashboardSidebar.css';

function DashboardSidebar({ userName, onScheduleClick, scheduledMeetingsCount }) {
  const [showNewMeetingDropdown, setShowNewMeetingDropdown] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const navigate = useNavigate();

  const handleNewMeeting = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name in settings');
      return;
    }
    toast.info('Creating meeting...');
    // Create room and auto-join
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const userId = localStorage.getItem('userId');
      
      const response = await fetch(`${API_URL}/api/room/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userId || ''
        },
        body: JSON.stringify({
          userId: userId || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const room = await response.json();
      
      if (!room.roomId) {
        throw new Error('Invalid room data received');
      }

      const params = new URLSearchParams({ name: userName, autoStart: 'true' });
      if (room.password) {
        params.append('password', room.password);
      }
      navigate(`/room/${room.roomId}?${params.toString()}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error(error.message || 'Failed to create meeting');
    }
  };

  const handleJoin = () => {
    setShowJoinModal(true);
  };

  const handleSchedule = () => {
    onScheduleClick();
  };

  const handleShareScreen = () => {
    setShowScreenShareModal(true);
  };

  return (
    <div className="dashboard-sidebar">
      <div className="action-buttons">
        <div className="action-button-group">
          <button 
            className={`action-btn new-meeting-btn ${showNewMeetingDropdown ? 'active' : ''}`}
            onClick={handleNewMeeting}
            onMouseEnter={() => setShowNewMeetingDropdown(true)}
            onMouseLeave={() => setShowNewMeetingDropdown(false)}
          >
            <HiVideoCamera className="action-btn-icon" />
            <div className="action-btn-content">
              <div>
                <div>New</div>
                <div className="meeting-line">
                  meeting
                  <HiChevronDown className="dropdown-icon" />
                </div>
              </div>
            </div>
            {showNewMeetingDropdown && (
              <div 
                className="dropdown-menu"
                onMouseEnter={() => setShowNewMeetingDropdown(true)}
                onMouseLeave={() => setShowNewMeetingDropdown(false)}
              >
                <button onClick={handleNewMeeting}>Start instant meeting</button>
                <button onClick={handleSchedule}>Schedule for later</button>
              </div>
            )}
          </button>

          <button className="action-btn join-btn" onClick={handleJoin}>
            <HiPlus className="action-btn-icon" />
            <span>Join</span>
          </button>

          <button className="action-btn schedule-btn" onClick={handleSchedule}>
            <HiCalendar className="action-btn-icon" />
            <div className="action-btn-content">
              <span>Schedule</span>
              {scheduledMeetingsCount > 0 && (
                <span className="badge-count">{scheduledMeetingsCount}</span>
              )}
            </div>
          </button>

          <button className="action-btn share-btn" onClick={handleShareScreen}>
            <HiArrowUpTray className="action-btn-icon" />
            <div className="action-btn-content">
              <div>
                <div>Share</div>
                <div>screen</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <JoinRoomModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <ScreenShareModal 
        isOpen={showScreenShareModal} 
        onClose={() => setShowScreenShareModal(false)}
        userName={userName}
      />
    </div>
  );
}

export default DashboardSidebar;

