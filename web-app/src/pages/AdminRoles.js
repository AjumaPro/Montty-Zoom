import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiPlus, HiShieldCheck } from 'react-icons/hi2';
import { getRoles, createRole, assignRole } from '../utils/adminAuthExtended';
import './AdminCommon.css';

function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ roleName: '', description: '', permissions: {} });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const data = await getRoles();
    setRoles(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createRole(formData);
    if (result) {
      toast.success('Role created successfully');
      setShowModal(false);
      setFormData({ roleName: '', description: '', permissions: {} });
      loadRoles();
    }
  };

  if (loading) {
    return (
      <div className="admin-roles-loading">
        <div className="admin-spinner"></div>
        <p>Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="admin-roles-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Role Management</h1>
          <p className="admin-page-subtitle">Manage admin roles and permissions</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <HiPlus />
          Create Role
        </button>
      </div>

      <div className="admin-roles-grid">
        {roles.map(role => (
          <div key={role.id || role.role_name} className="admin-role-card">
            <div className="admin-role-header">
              <HiShieldCheck className="admin-role-icon" />
              <h3>{role.role_name || role.roleName}</h3>
            </div>
            <p className="admin-role-description">{role.description || 'No description'}</p>
            <div className="admin-role-permissions">
              <span>Permissions: {Object.keys(role.permissions || {}).length}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Create Role</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRoles;

