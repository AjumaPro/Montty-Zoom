import React, { useState, useEffect } from 'react';
import { HiXMark, HiUsers, HiArrowRight, HiArrowLeft, HiPlus, HiTrash } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './BreakoutRooms.css';

function BreakoutRooms({ isOpen, onClose, socket, roomId, userId, isHost, participants }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [assignments, setAssignments] = useState(new Map()); // userId -> roomId

  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.on('breakout-rooms-updated', (data) => {
      setRooms(data.rooms || []);
      setAssignments(new Map(data.assignments || []));
    });

    socket.on('breakout-room-joined', (data) => {
      toast.info(`Joined breakout room: ${data.roomName}`);
    });

    return () => {
      socket.off('breakout-rooms-updated');
      socket.off('breakout-room-joined');
    };
  }, [socket, isOpen]);

  const createBreakoutRoom = () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    if (socket) {
      socket.emit('create-breakout-room', {
        roomId,
        userId,
        roomName: newRoomName.trim()
      });
      setNewRoomName('');
      toast.success(`Breakout room "${newRoomName}" created`);
    }
  };

  const deleteBreakoutRoom = (breakoutRoomId) => {
    if (socket) {
      socket.emit('delete-breakout-room', {
        roomId,
        userId,
        breakoutRoomId
      });
      toast.info('Breakout room deleted');
    }
  };

  const assignParticipant = (participantId, breakoutRoomId) => {
    if (socket) {
      socket.emit('assign-to-breakout-room', {
        roomId,
        userId,
        participantId,
        breakoutRoomId
      });
      toast.success('Participant assigned');
    }
  };

  const moveToBreakoutRoom = (breakoutRoomId) => {
    if (socket) {
      socket.emit('join-breakout-room', {
        roomId,
        userId,
        breakoutRoomId
      });
    }
  };

  const closeBreakoutRooms = () => {
    if (socket) {
      socket.emit('close-breakout-rooms', {
        roomId,
        userId
      });
      toast.info('All participants returned to main room');
    }
  };

  const getRoomParticipants = (breakoutRoomId) => {
    return participants.filter(p => assignments.get(p.id) === breakoutRoomId);
  };

  const getUnassignedParticipants = () => {
    return participants.filter(p => !assignments.has(p.id));
  };

  if (!isOpen) return null;

  return (
    <div className="breakout-rooms-overlay" onClick={onClose}>
      <div className="breakout-rooms-panel" onClick={(e) => e.stopPropagation()}>
        <div className="breakout-rooms-header">
          <h2>Breakout Rooms</h2>
          <button onClick={onClose} className="close-btn">
            <HiXMark />
          </button>
        </div>

        <div className="breakout-rooms-content">
          {isHost && (
            <div className="breakout-controls">
              <div className="create-room-section">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="room-name-input"
                  onKeyPress={(e) => e.key === 'Enter' && createBreakoutRoom()}
                />
                <button onClick={createBreakoutRoom} className="create-btn">
                  <HiPlus /> Create Room
                </button>
              </div>
              <button onClick={closeBreakoutRooms} className="close-all-btn">
                Close All Rooms
              </button>
            </div>
          )}

          <div className="breakout-rooms-list">
            {rooms.map((room) => {
              const roomParticipants = getRoomParticipants(room.id);
              return (
                <div key={room.id} className="breakout-room-card">
                  <div className="room-header">
                    <h3>{room.name}</h3>
                    {isHost && (
                      <button
                        onClick={() => deleteBreakoutRoom(room.id)}
                        className="delete-room-btn"
                      >
                        <HiTrash />
                      </button>
                    )}
                  </div>
                  <div className="room-participants">
                    <div className="participants-count">
                      {roomParticipants.length} participant{roomParticipants.length !== 1 ? 's' : ''}
                    </div>
                    <div className="participants-list">
                      {roomParticipants.map((p) => (
                        <span key={p.id} className="participant-badge">
                          {p.userName || p.id.substring(0, 8)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!isHost && (
                    <button
                      onClick={() => moveToBreakoutRoom(room.id)}
                      className="join-room-btn"
                    >
                      <HiArrowRight /> Join Room
                    </button>
                  )}
                  {isHost && (
                    <div className="assign-section">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignParticipant(e.target.value, room.id);
                            e.target.value = '';
                          }
                        }}
                        className="assign-select"
                      >
                        <option value="">Assign participant...</option>
                        {getUnassignedParticipants().map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.userName || p.id.substring(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {getUnassignedParticipants().length > 0 && isHost && (
            <div className="unassigned-section">
              <h3>Unassigned Participants ({getUnassignedParticipants().length})</h3>
              <div className="unassigned-list">
                {getUnassignedParticipants().map((p) => (
                  <span key={p.id} className="participant-badge">
                    {p.userName || p.id.substring(0, 8)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BreakoutRooms;

