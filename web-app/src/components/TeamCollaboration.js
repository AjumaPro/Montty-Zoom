import React from 'react';
import { HiPlus } from 'react-icons/hi2';
import './TeamCollaboration.css';

function TeamCollaboration({ onAddMember }) {
  // Sample team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Alexandra Deff',
      task: 'Working on Github Project Repository',
      status: 'completed',
      avatar: 'AD'
    },
    {
      id: 2,
      name: 'Edwin Adenike',
      task: 'Working on Integrate User Authentication System',
      status: 'in-progress',
      avatar: 'EA'
    },
    {
      id: 3,
      name: 'Isaac Oluwatemilorun',
      task: 'Working on Develop Search and Filter Functionality',
      status: 'pending',
      avatar: 'IO'
    },
    {
      id: 4,
      name: 'David Oshodi',
      task: 'Working on Responsive Layout for Homepage',
      status: 'in-progress',
      avatar: 'DO'
    }
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return '';
    }
  };

  return (
    <div className="team-collaboration">
      <div className="team-header">
        <h2 className="team-title">Team Collaboration</h2>
        <button className="add-member-btn" onClick={() => onAddMember && onAddMember()}>
          <HiPlus />
          Add Member
        </button>
      </div>
      <div className="team-list">
        {teamMembers.map(member => (
          <div key={member.id} className="team-member">
            <div className="member-avatar">
              {member.avatar}
            </div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-task">{member.task}</div>
            </div>
            <div className={`member-status ${getStatusClass(member.status)}`}>
              {getStatusLabel(member.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamCollaboration;

