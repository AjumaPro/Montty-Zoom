import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HiArrowPath, HiVideoCamera } from 'react-icons/hi2';
import './SummaryCards.css';

function SummaryCards({ meetings }) {
  const navigate = useNavigate();
  const now = new Date();
  
  const totalMeetings = meetings.length;
  const endedMeetings = meetings.filter(m => {
    const meetingEnd = new Date(new Date(m.scheduledDateTime).getTime() + m.duration * 60000);
    return meetingEnd < now;
  }).length;
  const runningMeetings = meetings.filter(m => {
    const start = new Date(m.scheduledDateTime);
    const end = new Date(start.getTime() + m.duration * 60000);
    return start <= now && end >= now;
  }).length;
  const upcomingMeetings = meetings.filter(m => {
    const start = new Date(m.scheduledDateTime);
    return start > now;
  }).length;

  const handleStartQuickMeeting = async () => {
    const userName = localStorage.getItem('userName') || 'User';
    if (!userName.trim()) {
      toast.error('Please enter your name in settings');
      return;
    }
    
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

      const params = new URLSearchParams({ name: userName, autoStart: 'true' });
      if (room.password) {
        params.append('password', room.password);
      }
      navigate(`/room/${room.roomId}?${params.toString()}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Failed to create meeting room');
    }
  };

  const cards = [
    {
      id: 'total',
      title: 'Total Meetings',
      value: totalMeetings,
      change: '+5 Increased from last month',
      bgColor: '#16a34a',
      textColor: 'white',
      isPrimary: true
    },
    {
      id: 'ended',
      title: 'Ended Meetings',
      value: endedMeetings,
      change: '+6 Increased from last month',
      bgColor: 'white',
      textColor: '#1a202c'
    },
    {
      id: 'running',
      title: 'Running Meetings',
      value: runningMeetings,
      change: '+2 Increased from last month',
      bgColor: 'white',
      textColor: '#1a202c'
    },
    {
      id: 'pending',
      title: 'Pending Meetings',
      value: upcomingMeetings,
      change: 'On Discuss',
      bgColor: 'white',
      textColor: '#1a202c'
    }
  ];

  return (
    <div className="summary-cards">
      {cards.map(card => (
        <div
          key={card.id}
          className={`summary-card ${card.isPrimary ? 'primary' : ''}`}
          style={{
            background: card.bgColor,
            color: card.textColor
          }}
        >
          <div className="card-header">
            <h3 className="card-title">{card.title}</h3>
            {card.id === 'total' ? (
              <button 
                className="card-icon start-meeting-icon" 
                onClick={handleStartQuickMeeting}
                title="Start Quick Meeting"
              >
                <HiVideoCamera />
              </button>
            ) : (
              <button className="card-icon">
                <HiArrowPath />
              </button>
            )}
          </div>
          <div className="card-value">{card.value}</div>
          <div className="card-change">
            <span className="change-indicator"></span>
            {card.change}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;

