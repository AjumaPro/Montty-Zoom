import React, { useState, useEffect } from 'react';
import './WaitingRoomPanel.css';

const WaitingRoomPanel = ({ socket, roomId, userId, isHost, isOpen, onClose, waitingUsers }) => {
  const [users, setUsers] = useState(waitingUsers || []);

  useEffect(() => {
    setUsers(waitingUsers || []);
  }, [waitingUsers]);

  useEffect(() => {
    if (!socket || !isHost) return;

    const handleWaitingRoomRequest = (user) => {
      setUsers(prev => [...prev, user]);
    };

    const handleWaitingRoomUpdate = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    socket.on('waiting-room-request', handleWaitingRoomRequest);
    socket.on('waiting-room-updated', handleWaitingRoomUpdate);

    return () => {
      socket.off('waiting-room-request', handleWaitingRoomRequest);
      socket.off('waiting-room-updated', handleWaitingRoomUpdate);
    };
  }, [socket, isHost]);

  const approveUser = (targetUserId) => {
    if (socket && isHost) {
      socket.emit('approve-waiting-user', { roomId, userId, targetUserId });
    }
  };

  const rejectUser = (targetUserId) => {
    if (socket && isHost) {
      socket.emit('reject-waiting-user', { roomId, userId, targetUserId });
    }
  };

  if (!isOpen || !isHost) return null;

  return (
    <div className="waiting-room-panel">
      <div className="waiting-room-header">
        <h3>Waiting Room ({users.length})</h3>
        <button onClick={onClose} className="waiting-room-close-btn">×</button>
      </div>
      <div className="waiting-room-list">
        {users.length === 0 ? (
          <p className="waiting-room-empty">No one is waiting</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="waiting-user-item">
              <div className="waiting-user-info">
                <strong>{user.userName}</strong>
                <span className="waiting-time">
                  Waiting {Math.floor((new Date() - new Date(user.joinedAt)) / 1000)}s
                </span>
              </div>
              <div className="waiting-user-actions">
                <button
                  onClick={() => approveUser(user.id)}
                  className="approve-btn"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => rejectUser(user.id)}
                  className="reject-btn"
                >
                  × Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WaitingRoomPanel;

