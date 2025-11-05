import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiPencil, HiTrash, HiXMark, HiCheckCircle, HiXCircle, HiLockClosed, HiLockOpen, HiStar } from 'react-icons/hi2';
import { getAllUsers, deleteUser, updateUser, approveUser, rejectUser, suspendUser, unsuspendUser, grantPremiumSubscription } from '../utils/adminAuth';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, suspended
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [actionModal, setActionModal] = useState({ open: false, type: '', userId: null, userName: '' });
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    const success = await deleteUser(userId);
    if (success) {
      toast.success('User deleted successfully');
      loadUsers();
    } else {
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.userId);
    setEditForm({ name: user.name || '', email: user.email || '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }
    const updated = await updateUser(editingUser, editForm);
    if (updated) {
      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } else {
      toast.error('Failed to update user');
    }
  };

  const openActionModal = (type, user) => {
    setActionModal({ open: true, type, userId: user.userId, userName: user.name || user.email });
    setActionReason('');
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: '', userId: null, userName: '' });
    setActionReason('');
  };

  const handleApprove = async () => {
    const result = await approveUser(actionModal.userId);
    if (result) {
      toast.success(`User "${actionModal.userName}" approved successfully`);
      closeActionModal();
      loadUsers();
    } else {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async () => {
    const result = await rejectUser(actionModal.userId, actionReason);
    if (result) {
      toast.success(`User "${actionModal.userName}" rejected successfully`);
      closeActionModal();
      loadUsers();
    } else {
      toast.error('Failed to reject user');
    }
  };

  const handleSuspend = async () => {
    const result = await suspendUser(actionModal.userId, actionReason);
    if (result) {
      toast.success(`User "${actionModal.userName}" suspended successfully`);
      closeActionModal();
      loadUsers();
    } else {
      toast.error('Failed to suspend user');
    }
  };

  const handleUnsuspend = async (user) => {
    const result = await unsuspendUser(user.userId);
    if (result) {
      toast.success(`User "${user.name || user.email}" reactivated successfully`);
      loadUsers();
    } else {
      toast.error('Failed to reactivate user');
    }
  };

  const handleGrantPremium = async (user) => {
    if (!window.confirm(`Grant premium subscription to "${user.name || user.email}"?`)) {
      return;
    }
    const result = await grantPremiumSubscription(user.userId);
    if (result) {
      toast.success(`Premium subscription granted to "${user.name || user.email}" successfully`);
      loadUsers();
    } else {
      toast.error('Failed to grant premium subscription');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      suspended: '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.userId || '').toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === 'all' || (user.status || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = users.filter(u => (u.status || 'pending') === 'pending').length;

  if (loading) {
    return (
      <div className="admin-users-loading">
        <div className="admin-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div>
          <h1 className="admin-page-title">Users Management</h1>
          <p className="admin-page-subtitle">Manage all platform users</p>
        </div>
        <div className="admin-users-header-right">
          <div className="admin-status-filters">
            <button
              className={`admin-status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({users.length})
            </button>
            <button
              className={`admin-status-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`admin-status-filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('approved')}
            >
              Approved
            </button>
            <button
              className={`admin-status-filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
            </button>
            <button
              className={`admin-status-filter-btn ${statusFilter === 'suspended' ? 'active' : ''}`}
              onClick={() => setStatusFilter('suspended')}
            >
              Suspended
            </button>
          </div>
          <div className="admin-search-box">
            <HiMagnifyingGlass className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      {pendingCount > 0 && statusFilter === 'all' && (
        <div className="admin-pending-alert">
          <div className="admin-pending-alert-content">
            <HiXCircle className="admin-pending-icon" />
            <span>{pendingCount} account{pendingCount !== 1 ? 's' : ''} pending approval</span>
            <button
              className="admin-action-btn admin-btn-primary"
              onClick={() => setStatusFilter('pending')}
            >
              Review Pending
            </button>
          </div>
        </div>
      )}

      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Last Signed In</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const userStatus = user.status || 'pending';
                return (
                  <tr key={user.userId}>
                    {editingUser === user.userId ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="admin-edit-input"
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="admin-edit-input"
                          />
                        </td>
                        <td>
                          <span className="admin-status-badge" style={{ backgroundColor: getStatusColor(userStatus) + '20', color: getStatusColor(userStatus) }}>
                            {userStatus}
                          </span>
                        </td>
                        <td>{user.userId}</td>
                        <td>{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <button
                            className="admin-action-btn admin-btn-save"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="admin-action-btn admin-btn-cancel"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                          <span className="admin-status-badge" style={{ backgroundColor: getStatusColor(userStatus) + '20', color: getStatusColor(userStatus) }}>
                            {userStatus}
                          </span>
                        </td>
                        <td className="admin-user-id">{user.userId}</td>
                        <td>{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <div className="admin-actions">
                            {userStatus === 'pending' && (
                              <>
                                <button
                                  className="admin-icon-btn admin-icon-btn-success"
                                  onClick={() => openActionModal('approve', user)}
                                  title="Approve"
                                >
                                  <HiCheckCircle />
                                </button>
                                <button
                                  className="admin-icon-btn admin-icon-btn-danger"
                                  onClick={() => openActionModal('reject', user)}
                                  title="Reject"
                                >
                                  <HiXCircle />
                                </button>
                              </>
                            )}
                            {userStatus === 'approved' && (
                              <>
                                <button
                                  className="admin-icon-btn admin-icon-btn-premium"
                                  onClick={() => handleGrantPremium(user)}
                                  title="Grant Premium Subscription"
                                >
                                  <HiStar />
                                </button>
                                <button
                                  className="admin-icon-btn admin-icon-btn-warning"
                                  onClick={() => openActionModal('suspend', user)}
                                  title="Suspend"
                                >
                                  <HiLockClosed />
                                </button>
                              </>
                            )}
                            {userStatus === 'suspended' && (
                              <button
                                className="admin-icon-btn admin-icon-btn-success"
                                onClick={() => handleUnsuspend(user)}
                                title="Reactivate"
                              >
                                <HiLockOpen />
                              </button>
                            )}
                            <button
                              className="admin-icon-btn"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                            >
                              <HiPencil />
                            </button>
                            <button
                              className="admin-icon-btn admin-icon-btn-danger"
                              onClick={() => handleDelete(user.userId)}
                              title="Delete"
                            >
                              <HiTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-users-footer">
        <p>Total Users: {users.length} | Pending: {pendingCount}</p>
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="admin-modal-overlay" onClick={closeActionModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>
                {actionModal.type === 'approve' && 'Approve User'}
                {actionModal.type === 'reject' && 'Reject User'}
                {actionModal.type === 'suspend' && 'Suspend User'}
              </h2>
              <button className="admin-modal-close" onClick={closeActionModal}>
                <HiXMark />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>
                {actionModal.type === 'approve' && `Are you sure you want to approve "${actionModal.userName}"?`}
                {actionModal.type === 'reject' && `Are you sure you want to reject "${actionModal.userName}"?`}
                {actionModal.type === 'suspend' && `Are you sure you want to suspend "${actionModal.userName}"?`}
              </p>
              {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                <div className="admin-form-group">
                  <label>Reason (optional)</label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason for rejection/suspension..."
                    rows="3"
                    className="admin-textarea"
                  />
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button
                className="admin-action-btn admin-btn-secondary"
                onClick={closeActionModal}
              >
                Cancel
              </button>
              <button
                className={`admin-action-btn ${
                  actionModal.type === 'approve' ? 'admin-btn-success' :
                  actionModal.type === 'reject' || actionModal.type === 'suspend' ? 'admin-btn-danger' :
                  'admin-btn-primary'
                }`}
                onClick={() => {
                  if (actionModal.type === 'approve') handleApprove();
                  else if (actionModal.type === 'reject') handleReject();
                  else if (actionModal.type === 'suspend') handleSuspend();
                }}
              >
                {actionModal.type === 'approve' && 'Approve'}
                {actionModal.type === 'reject' && 'Reject'}
                {actionModal.type === 'suspend' && 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;

