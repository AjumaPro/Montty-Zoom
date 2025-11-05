import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { HiXMark, HiComputerDesktop, HiVideoCamera } from 'react-icons/hi2';
import './ScreenShareModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ScreenShareModal({ isOpen, onClose, userName }) {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleStartScreenShare = async () => {
    if (!userName?.trim()) {
      toast.error('Please enter your name in settings');
      return;
    }

    // Check if screen sharing is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      toast.error('Screen sharing is not supported in your browser');
      return;
    }

    setIsCreating(true);
    try {
      // Create a room for screen sharing
      const response = await axios.post(`${API_URL}/api/room/create`);
      const room = response.data;
      
      // Navigate to room with screen share flag
      const params = new URLSearchParams({ 
        name: userName,
        autoStart: 'true',
        screenShare: 'true'
      });
      
      if (room.password) {
        params.append('password', room.password);
      }
      
      toast.success('Creating meeting for screen sharing...');
      navigate(`/room/${room.roomId}?${params.toString()}`);
      onClose();
    } catch (error) {
      console.error('Error creating room for screen share:', error);
      toast.error('Failed to start screen sharing session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoomAndShare = () => {
    // This will be handled by showing a modal to enter room ID
    toast.info('Please join a room first, then use the screen share button in the meeting');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="screen-share-modal-overlay" onClick={onClose}>
      <div className="screen-share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="screen-share-modal-header">
          <div className="screen-share-header-content">
            <HiComputerDesktop className="screen-share-header-icon" />
            <h2>Share Your Screen</h2>
          </div>
          <button className="screen-share-modal-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="screen-share-modal-content">
          <div className="screen-share-info">
            <p>Start a new meeting and share your screen with others.</p>
            <div className="screen-share-features">
              <div className="feature-item">
                <HiVideoCamera className="feature-icon" />
                <span>Share your entire screen or a specific window</span>
              </div>
              <div className="feature-item">
                <HiComputerDesktop className="feature-icon" />
                <span>Include system audio (if supported)</span>
              </div>
              <div className="feature-item">
                <HiVideoCamera className="feature-icon" />
                <span>Others can join and view your screen</span>
              </div>
            </div>
          </div>

          <div className="screen-share-options">
            <button
              className="screen-share-btn-primary"
              onClick={handleStartScreenShare}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating Meeting...
                </>
              ) : (
                <>
                  <HiComputerDesktop className="btn-icon" />
                  Start Screen Sharing
                </>
              )}
            </button>

            <button
              className="screen-share-btn-secondary"
              onClick={handleJoinRoomAndShare}
            >
              <HiVideoCamera className="btn-icon" />
              Join Existing Room
            </button>
          </div>

          <div className="screen-share-note">
            <p>
              <strong>Note:</strong> You'll be prompted to select which screen or window to share after starting the meeting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreenShareModal;

