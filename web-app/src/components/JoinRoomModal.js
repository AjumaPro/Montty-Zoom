import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HiXMark, HiVideoCamera } from 'react-icons/hi2';
import './JoinRoomModal.css';

function JoinRoomModal({ isOpen, onClose }) {
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    setIsJoining(true);
    try {
      // Save name to localStorage
      localStorage.setItem('userName', userName);

      // Navigate to room
      const params = new URLSearchParams({ name: userName });
      if (roomPassword.trim()) {
        params.append('password', roomPassword);
      }
      
      toast.info('Joining room...');
      navigate(`/room/${roomId.trim()}?${params.toString()}`);
      onClose();
    } catch (error) {
      toast.error('Failed to join room');
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="join-modal-overlay" onClick={onClose}>
      <div className="join-modal" onClick={(e) => e.stopPropagation()}>
        <div className="join-modal-header">
          <h2>Join a Meeting</h2>
          <button className="join-modal-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="join-modal-content">
          <div className="join-form-group">
            <label htmlFor="join-name">Your Name</label>
            <input
              type="text"
              id="join-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="join-form-group">
            <label htmlFor="join-room-id">Room ID</label>
            <input
              type="text"
              id="join-room-id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="join-form-group">
            <label htmlFor="join-password">Room Password (Optional)</label>
            <input
              type="password"
              id="join-password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="Enter password if required"
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        <div className="join-modal-actions">
          <button className="join-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="join-btn-submit" 
            onClick={handleJoin}
            disabled={isJoining || !roomId.trim() || !userName.trim()}
          >
            {isJoining ? (
              <>
                <div className="btn-spinner"></div>
                Joining...
              </>
            ) : (
              <>
                <HiVideoCamera /> Join Meeting
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinRoomModal;

