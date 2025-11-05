import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HiPlus, HiVideoCamera, HiShare } from 'react-icons/hi2';
import ShareMeeting from './ShareMeeting';
import './MeetingList.css';

function MeetingList({ meetings, onAddMeeting }) {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const now = new Date();
  
  // Get all meetings, sorted by date (most recent first)
  const allMeetings = [...meetings]
    .sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMeetingIcon = (index) => {
    const icons = ['📋', '📅', '🎯', '📊', '🚀'];
    return icons[index % icons.length];
  };

  const handleStartMeeting = async (meeting) => {
    const userName = localStorage.getItem('userName') || 'User';
    const params = new URLSearchParams({ name: userName });
    
    if (meeting.roomId) {
      // Use meeting's room password if available
      if (meeting.roomPassword) {
        params.append('password', meeting.roomPassword);
      }
      navigate(`/room/${meeting.roomId}?${params.toString()}`);
    } else {
      // If no roomId, create a new room for this meeting
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
          throw new Error(errorData.error || 'Failed to create meeting room');
        }

        const room = await response.json();
        
        if (!room.roomId) {
          throw new Error('Invalid room data received');
        }

        if (room.password) {
          params.append('password', room.password);
        }
        navigate(`/room/${room.roomId}?${params.toString()}`);
      } catch (error) {
        console.error('Error creating room:', error);
        toast.error(error.message || 'Failed to create meeting room');
      }
    }
  };

  return (
    <div className="meeting-list">
      <div className="list-header">
        <h2 className="list-title">Meetings</h2>
        <button className="add-meeting-btn" onClick={onAddMeeting}>
          <HiPlus />
          New
        </button>
      </div>
      <div className="meetings-items">
        {allMeetings.length > 0 ? (
          allMeetings.map((meeting, index) => {
            const meetingDate = new Date(meeting.scheduledDateTime);
            const isPast = meetingDate < now;
            const isUpcoming = meetingDate > now;
            const isActive = meetingDate <= now && new Date(meetingDate.getTime() + (meeting.duration || 60) * 60000) > now;
            
            return (
            <div key={meeting.id} className={`meeting-item ${isPast ? 'past' : isActive ? 'active' : 'upcoming'}`}>
              <div className="meeting-icon">{getMeetingIcon(index)}</div>
              <div className="meeting-details">
                <div className="meeting-name">{meeting.title}</div>
                <div className="meeting-date">
                  {isPast && 'Past: '}
                  {isActive && 'Active: '}
                  {isUpcoming && 'Upcoming: '}
                  {formatDate(meeting.scheduledDateTime)}
                </div>
              </div>
              <div className="meeting-actions">
                {(isUpcoming || isActive) && meeting.roomId && (
                  <button 
                    className="share-meeting-btn-small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMeeting(meeting);
                      setShowShareModal(true);
                    }}
                    title="Share Meeting"
                    type="button"
                  >
                    <HiShare />
                  </button>
                )}
                {(isUpcoming || isActive) && (
                  <button 
                    className="start-meeting-btn-small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartMeeting(meeting);
                    }}
                    title="Start Meeting"
                    type="button"
                  >
                    <HiVideoCamera />
                  </button>
                )}
              </div>
            </div>
            );
          })
        ) : (
          <div className="no-meetings">
            <p>No meetings scheduled</p>
          </div>
        )}
      </div>

      {showShareModal && selectedMeeting && (
        <ShareMeeting
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedMeeting(null);
          }}
          roomId={selectedMeeting.roomId}
          roomPassword={selectedMeeting.roomPassword}
        />
      )}
    </div>
  );
}

export default MeetingList;

