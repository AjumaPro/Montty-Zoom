import React from 'react';
import { HiPlus } from 'react-icons/hi2';
import './AdminTeamCollaboration.css';

function AdminTeamCollaboration({ teamMembers = [], onAddMember }) {
  const defaultMembers = [
    { 
      id: 1, 
      name: 'Alexandra Deff', 
      task: 'Working on Github Project Repository', 
      status: 'Completed',
      avatar: '👤'
    },
    { 
      id: 2, 
      name: 'Edwin Adenike', 
      task: 'Working on Integrate User Authentication System', 
      status: 'In Progress',
      avatar: '👤'
    },
    { 
      id: 3, 
      name: 'Isaac Oluwatemilorun', 
      task: 'Working on Develop Search and Filter Functionality', 
      status: 'Pending',
      avatar: '👤'
    },
    { 
      id: 4, 
      name: 'David Oshodi', 
      task: 'Working on Responsive Layout for Homepage', 
      status: 'In Progress',
      avatar: '👤'
    }
  ];

  const displayMembers = teamMembers.length > 0 ? teamMembers : defaultMembers;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#d1fae5', color: '#065f46', text: '#10b981' };
      case 'In Progress':
        return { bg: '#fef3c7', color: '#92400e', text: '#f59e0b' };
      case 'Pending':
        return { bg: '#fee2e2', color: '#991b1b', text: '#ef4444' };
      default:
        return { bg: '#f3f4f6', color: '#374151', text: '#6b7280' };
    }
  };

  return (
    <div className="admin-team-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Team Collaboration</h3>
        <button className="admin-add-btn" onClick={onAddMember}>
          <HiPlus />
          Add Member
        </button>
      </div>
      <div className="admin-team-list">
        {displayMembers.map((member) => {
          const statusStyle = getStatusColor(member.status);
          return (
            <div key={member.id} className="admin-team-item">
              <div className="admin-team-avatar">{member.avatar || '👤'}</div>
              <div className="admin-team-info">
                <div className="admin-team-name">{member.name}</div>
                <div className="admin-team-task">{member.task}</div>
                <div 
                  className="admin-team-status"
                  style={{ 
                    background: statusStyle.bg,
                    color: statusStyle.text
                  }}
                >
                  {member.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminTeamCollaboration;

