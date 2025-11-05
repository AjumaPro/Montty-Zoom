import React, { useState, useEffect } from 'react';
import { HiPlus, HiUserCircle, HiEnvelope, HiPhone, HiTrash, HiPencil } from 'react-icons/hi2';
import { getTeamMembers, saveTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../utils/teamStorage';
import './Team.css';

function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Developer'
  });

  useEffect(() => {
    // Load team members from storage
    const members = getTeamMembers();
    setTeamMembers(members);
  }, []);

  const handleAddMember = () => {
    if (formData.name && formData.email) {
      const updatedMembers = addTeamMember(formData);
      setTeamMembers(updatedMembers);
      setFormData({ name: '', email: '', phone: '', role: 'Developer' });
      setShowAddModal(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      const updatedMembers = deleteTeamMember(id);
      setTeamMembers(updatedMembers);
    }
  };

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage your team members and their roles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <HiPlus />
          Add Member
        </button>
      </div>

      <div className="team-stats">
        <div className="stat-card">
          <div className="stat-value">{teamMembers.length}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teamMembers.filter(m => m.status === 'active').length}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>

      <div className="team-grid">
        {teamMembers.map(member => (
          <div key={member.id} className="team-card">
            <div className="member-avatar-large">
              {member.avatar}
            </div>
            <div className="member-info">
              <h3 className="member-name">{member.name}</h3>
              <p className="member-role">{member.role}</p>
              <div className="member-contact">
                <div className="contact-item">
                  <HiEnvelope className="contact-icon" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="contact-item">
                    <HiPhone className="contact-icon" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="member-actions">
              <button className="action-btn edit" title="Edit">
                <HiPencil />
              </button>
              <button className="action-btn delete" onClick={() => handleDelete(member.id)} title="Delete">
                <HiTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Team Member</h2>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option>Developer</option>
                <option>Designer</option>
                <option>Manager</option>
                <option>Product Owner</option>
                <option>QA</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Team;

