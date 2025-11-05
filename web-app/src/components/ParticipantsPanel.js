import React, { useState, useEffect, useMemo } from 'react';
import { 
  HiUserPlus, 
  HiUserMinus, 
  HiXMark,
  HiShieldCheck,
  HiStar,
  HiVideoCameraSlash, 
  HiSpeakerXMark,
  HiMicrophone,
  HiSpeakerWave,
  HiMagnifyingGlass,
  HiChevronDown,
  HiChevronUp
} from 'react-icons/hi2';
import './ParticipantsPanel.css';

const ParticipantsPanel = ({ socket, roomId, userId, isHost, isMainHost, isModerator, mainHost, moderators, isOpen, onClose, participants }) => {
  const [participantsList, setParticipantsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByRole, setGroupByRole] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({
    mainHost: true,
    moderators: true,
    participants: true
  });

  useEffect(() => {
    if (participants) {
      setParticipantsList(participants);
    }
  }, [participants]);

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (user) => {
      setParticipantsList(prev => {
        // Avoid duplicates
        if (prev.find(p => p.id === user.id)) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (data) => {
      setParticipantsList(prev => prev.filter(p => p.id !== data.userId));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket]);

  const getParticipantRole = (participantId) => {
    if (participantId === mainHost) return 'mainHost';
    if (moderators && moderators.includes(participantId)) return 'moderator';
    return 'participant';
  };

  // Filter and group participants
  const filteredAndGroupedParticipants = useMemo(() => {
    let filtered = participantsList;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = participantsList.filter(p => 
        p.userName.toLowerCase().includes(query)
      );
    }

    if (!groupByRole) {
      return { all: filtered };
    }

    // Group by role
    const grouped = {
      mainHost: [],
      moderators: [],
      participants: []
    };

    filtered.forEach(participant => {
      const role = getParticipantRole(participant.id);
      if (role === 'mainHost') {
        grouped.mainHost.push(participant);
      } else if (role === 'moderator') {
        grouped.moderators.push(participant);
      } else {
        grouped.participants.push(participant);
      }
    });

    // Sort within groups
    grouped.moderators.sort((a, b) => a.userName.localeCompare(b.userName));
    grouped.participants.sort((a, b) => a.userName.localeCompare(b.userName));

    return grouped;
  }, [participantsList, searchQuery, groupByRole, mainHost, moderators]);

  const muteAll = () => {
    if (socket && isHost) {
      socket.emit('mute-all', { roomId, userId });
    }
  };

  const kickUser = (targetUserId) => {
    if (socket && isHost && targetUserId !== userId && targetUserId !== mainHost) {
      socket.emit('kick-user', { roomId, userId, targetUserId });
    }
  };

  const promoteToModerator = (targetUserId) => {
    if (socket && isMainHost && targetUserId !== userId && targetUserId !== mainHost) {
      socket.emit('promote-to-moderator', { roomId, userId, targetUserId });
    }
  };

  const demoteModerator = (targetUserId) => {
    if (socket && isMainHost && targetUserId !== userId && targetUserId !== mainHost) {
      socket.emit('demote-moderator', { roomId, userId, targetUserId });
    }
  };

  const muteParticipant = (targetUserId) => {
    if (socket && isHost && targetUserId !== userId && targetUserId !== mainHost) {
      socket.emit('mute-participant', { roomId, userId, targetUserId });
    }
  };

  const unmuteParticipant = (targetUserId) => {
    if (socket && isHost && targetUserId !== userId && targetUserId !== mainHost) {
      socket.emit('unmute-participant', { roomId, userId, targetUserId });
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const renderParticipant = (participant) => {
    const role = getParticipantRole(participant.id);
    const canManage = isMainHost && participant.id !== userId && participant.id !== mainHost;
    const showPromote = canManage && role === 'participant' && (!moderators || moderators.length < 5);
    const showDemote = canManage && role === 'moderator';
    const canKick = isHost && participant.id !== userId && participant.id !== mainHost;
    
    return (
      <div key={participant.id} className="participant-item">
        <div className="participant-info">
          <span className="participant-name">
            {participant.userName}
            {participant.id === userId && ' (You)'}
          </span>
          <div className="participant-roles">
            {role === 'mainHost' && (
              <span className="participant-badge participant-badge-main-host">
                <HiShieldCheck className="badge-icon" /> Main Host
              </span>
            )}
            {role === 'moderator' && (
              <span className="participant-badge participant-badge-moderator">
                <HiStar className="badge-icon" /> Moderator
              </span>
            )}
            {role === 'participant' && (
              <span className="participant-badge participant-badge-participant">
                Participant
              </span>
            )}
          </div>
        </div>
        <div className="participant-status">
          {!participant.isVideoEnabled && (
            <span className="status-icon" title="Video off">
              <HiVideoCameraSlash />
            </span>
          )}
          {!participant.isAudioEnabled && (
            <span className="status-icon" title="Audio muted">
              <HiSpeakerXMark />
            </span>
          )}
        </div>
        <div className="participant-actions">
          {isHost && participant.id !== userId && participant.id !== mainHost && (
            <>
              {participant.isAudioEnabled ? (
                <button
                  onClick={() => muteParticipant(participant.id)}
                  className="mute-participant-btn"
                  title="Mute participant"
                >
                  <HiSpeakerWave />
                </button>
              ) : (
                <button
                  onClick={() => unmuteParticipant(participant.id)}
                  className="unmute-participant-btn"
                  title="Unmute participant"
                >
                  <HiMicrophone />
                </button>
              )}
            </>
          )}
          {showPromote && (
            <button
              onClick={() => promoteToModerator(participant.id)}
              className="promote-btn"
              title="Promote to moderator"
            >
              <HiUserPlus />
            </button>
          )}
          {showDemote && (
            <button
              onClick={() => demoteModerator(participant.id)}
              className="demote-btn"
              title="Demote from moderator"
            >
              <HiUserMinus />
            </button>
          )}
          {canKick && (
            <button
              onClick={() => kickUser(participant.id)}
              className="kick-btn"
              title="Remove participant"
            >
              <HiXMark />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const totalParticipants = participantsList.length;
  const filteredCount = searchQuery.trim() 
    ? (filteredAndGroupedParticipants.all?.length || 
       Object.values(filteredAndGroupedParticipants).reduce((sum, arr) => sum + arr.length, 0))
    : totalParticipants;

  return (
    <div className="participants-panel">
      <div className="participants-header">
        <div>
          <h3>Participants</h3>
          <p className="participant-count">{filteredCount}{searchQuery.trim() ? ` of ${totalParticipants}` : ''}</p>
        </div>
        <button onClick={onClose} className="participants-close-btn">
          <HiXMark />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="participants-controls">
        <div className="search-container">
          <HiMagnifyingGlass className="search-icon" />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {isMainHost && (
          <div className="moderator-info">
            <span className="moderator-count">Moderators: {moderators ? moderators.length : 0}/5</span>
          </div>
        )}
        <div className="view-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={groupByRole}
              onChange={(e) => setGroupByRole(e.target.checked)}
            />
            <span>Group by role</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      {(isMainHost || isModerator) && (
        <div className="participants-actions">
          <button onClick={muteAll} className="participants-action-btn">
            Mute All
          </button>
        </div>
      )}

      {/* Participants List */}
      <div className="participants-list">
        {groupByRole ? (
          <>
            {/* Main Host */}
            {filteredAndGroupedParticipants.mainHost && filteredAndGroupedParticipants.mainHost.length > 0 && (
              <div className="participant-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup('mainHost')}
                >
                  <span className="group-title">
                    <HiShieldCheck className="group-icon" />
                    Main Host ({filteredAndGroupedParticipants.mainHost.length})
                  </span>
                  {expandedGroups.mainHost ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {expandedGroups.mainHost && (
                  <div className="group-content">
                    {filteredAndGroupedParticipants.mainHost.map(renderParticipant)}
                  </div>
                )}
              </div>
            )}

            {/* Moderators */}
            {filteredAndGroupedParticipants.moderators && filteredAndGroupedParticipants.moderators.length > 0 && (
              <div className="participant-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup('moderators')}
                >
                  <span className="group-title">
                    <HiStar className="group-icon" />
                    Moderators ({filteredAndGroupedParticipants.moderators.length})
                  </span>
                  {expandedGroups.moderators ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {expandedGroups.moderators && (
                  <div className="group-content">
                    {filteredAndGroupedParticipants.moderators.map(renderParticipant)}
                  </div>
                )}
              </div>
            )}

            {/* Participants */}
            {filteredAndGroupedParticipants.participants && filteredAndGroupedParticipants.participants.length > 0 && (
              <div className="participant-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup('participants')}
                >
                  <span className="group-title">
                    Participants ({filteredAndGroupedParticipants.participants.length})
                  </span>
                  {expandedGroups.participants ? <HiChevronUp /> : <HiChevronDown />}
                </div>
                {expandedGroups.participants && (
                  <div className="group-content">
                    {filteredAndGroupedParticipants.participants.map(renderParticipant)}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredAndGroupedParticipants.all && filteredAndGroupedParticipants.all.length > 0 ? (
              filteredAndGroupedParticipants.all.map(renderParticipant)
            ) : (
              <div className="no-participants">
                {searchQuery.trim() ? 'No participants found' : 'No participants'}
              </div>
            )}
          </>
        )}

        {totalParticipants === 0 && (
          <div className="no-participants">
            No participants yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;

