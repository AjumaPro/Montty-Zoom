import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiTrash, HiCalendar } from 'react-icons/hi2';
import { getMeetingHistory, deleteMeeting, getAllRooms } from '../utils/adminAuth';
import './AdminMeetings.css';

function AdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'history') {
      loadMeetingHistory();
    } else {
      loadRooms();
    }
  }, [activeTab]);

  const loadMeetingHistory = async () => {
    setLoading(true);
    const data = await getMeetingHistory();
    setMeetings(data);
    setLoading(false);
  };

  const loadRooms = async () => {
    setLoading(true);
    const data = await getAllRooms();
    setRooms(data);
    setLoading(false);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }
    const success = await deleteMeeting(meetingId);
    if (success) {
      toast.success('Meeting deleted successfully');
      loadMeetingHistory();
    } else {
      toast.error('Failed to delete meeting');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
    const { deleteRoom } = await import('../utils/adminAuth');
    const success = await deleteRoom(roomId);
    if (success) {
      toast.success('Room deleted successfully');
      loadRooms();
    } else {
      toast.error('Failed to delete room');
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const query = searchQuery.toLowerCase();
    return (
      (meeting.title || '').toLowerCase().includes(query) ||
      (meeting.roomId || '').toLowerCase().includes(query)
    );
  });

  const filteredRooms = rooms.filter(room => {
    const query = searchQuery.toLowerCase();
    return (
      (room.roomId || '').toLowerCase().includes(query) ||
      (room.id || '').toLowerCase().includes(query)
    );
  });

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="admin-meetings-loading">
        <div className="admin-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-meetings-container">
      <div className="admin-meetings-header">
        <div>
          <h1 className="admin-page-title">Meetings Management</h1>
          <p className="admin-page-subtitle">Manage meetings and active rooms</p>
        </div>
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HiCalendar />
          Meeting History
        </button>
        <button
          className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Active Rooms
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="admin-meetings-table-container">
          <table className="admin-meetings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Room ID</th>
                <th>Duration</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state">
                    No meetings found
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meeting) => (
                  <tr key={meeting.id || meeting.meetingId}>
                    <td>{meeting.title || 'Untitled Meeting'}</td>
                    <td className="admin-room-id">{meeting.roomId || 'N/A'}</td>
                    <td>{formatDuration(meeting.duration)}</td>
                    <td>{meeting.participantsCount || 0}</td>
                    <td>
                      <span className={`admin-status-badge admin-status-${meeting.status || 'completed'}`}>
                        {meeting.status || 'completed'}
                      </span>
                    </td>
                    <td>{meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        className="admin-icon-btn admin-icon-btn-danger"
                        onClick={() => handleDeleteMeeting(meeting.id || meeting.meetingId)}
                        title="Delete"
                      >
                        <HiTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-meetings-table-container">
          <table className="admin-meetings-table">
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state">
                    No active rooms
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.roomId || room.id}>
                    <td className="admin-room-id">{room.roomId || room.id}</td>
                    <td>{room.participantCount || (room.participants ? room.participants.length : 0)}</td>
                    <td>
                      <span className={`admin-status-badge admin-status-${room.meetingStatus || 'waiting'}`}>
                        {room.meetingStatus || 'waiting'}
                      </span>
                    </td>
                    <td>{room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        className="admin-icon-btn admin-icon-btn-danger"
                        onClick={() => handleDeleteRoom(room.roomId || room.id)}
                        title="Delete"
                      >
                        <HiTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminMeetings;

