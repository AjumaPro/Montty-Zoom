import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiPlus, HiMagnifyingGlass, HiPhone, HiClock, HiArrowPath } from 'react-icons/hi2';
import { getCustomerServiceCalls, createCustomerServiceCall, updateCustomerServiceCall } from '../utils/adminAuthExtended';
import './AdminCommon.css';

function AdminCustomerService() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [callForm, setCallForm] = useState({
    userId: '',
    userEmail: '',
    agentId: '',
    agentName: '',
    callType: 'inbound',
    priority: 'medium',
    subject: '',
    description: ''
  });

  useEffect(() => {
    loadCalls();
  }, [statusFilter]);

  const loadCalls = async () => {
    setLoading(true);
    const data = await getCustomerServiceCalls(statusFilter === 'all' ? null : statusFilter);
    setCalls(data);
    setLoading(false);
  };

  const handleCreateCall = async (e) => {
    e.preventDefault();
    const result = await createCustomerServiceCall(callForm);
    if (result) {
      toast.success('Customer service call created successfully');
      setShowCreateModal(false);
      setCallForm({
        userId: '',
        userEmail: '',
        agentId: '',
        agentName: '',
        callType: 'inbound',
        priority: 'medium',
        subject: '',
        description: ''
      });
      loadCalls();
    }
  };

  const handleUpdateCall = async (updates) => {
    const result = await updateCustomerServiceCall(selectedCall.call_id || selectedCall.callId, updates);
    if (result) {
      toast.success('Call updated successfully');
      setSelectedCall(null);
      loadCalls();
    }
  };

  const filteredCalls = calls.filter(call => {
    const query = searchQuery.toLowerCase();
    return (
      (call.user_email || '').toLowerCase().includes(query) ||
      (call.call_id || call.callId || '').toLowerCase().includes(query) ||
      (call.subject || '').toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#2563eb',
      resolved: '#10b981',
      closed: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="admin-customer-service-loading">
        <div className="admin-spinner"></div>
        <p>Loading customer service calls...</p>
      </div>
    );
  }

  return (
    <div className="admin-customer-service-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customer Service Calls</h1>
          <p className="admin-page-subtitle">Manage customer service interactions</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
          <HiPlus />
          New Call
        </button>
      </div>

      <div className="admin-customer-service-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <div className="admin-status-filters">
          <button
            className={`admin-status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`admin-status-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`admin-status-filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </button>
          <button
            className={`admin-status-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="admin-calls-list">
        {filteredCalls.map(call => (
          <div key={call.id || call.call_id || call.callId} className="admin-call-card" onClick={() => setSelectedCall(call)}>
            <div className="admin-call-header">
              <div>
                <h3>{call.subject || 'No Subject'}</h3>
                <p className="admin-call-user">{call.user_email || call.userEmail || call.user_id}</p>
              </div>
              <span
                className="admin-call-status"
                style={{ backgroundColor: getStatusColor(call.status) + '20', color: getStatusColor(call.status) }}
              >
                {call.status}
              </span>
            </div>
            <p className="admin-call-description">{call.description?.substring(0, 150)}...</p>
            <div className="admin-call-footer">
              <span><HiPhone /> {call.call_type || call.callType}</span>
              <span><HiClock /> {call.duration || 0} min</span>
              {call.agent_name && <span>Agent: {call.agent_name}</span>}
              <span>{new Date(call.created_at || call.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Create Customer Service Call</h2>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCall}>
              <div className="admin-form-group">
                <label>User ID *</label>
                <input
                  type="text"
                  value={callForm.userId}
                  onChange={(e) => setCallForm({ ...callForm, userId: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>User Email *</label>
                <input
                  type="email"
                  value={callForm.userEmail}
                  onChange={(e) => setCallForm({ ...callForm, userEmail: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={callForm.subject}
                  onChange={(e) => setCallForm({ ...callForm, subject: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Description *</label>
                <textarea
                  value={callForm.description}
                  onChange={(e) => setCallForm({ ...callForm, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Priority</label>
                <select
                  value={callForm.priority}
                  onChange={(e) => setCallForm({ ...callForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  Create Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCall && (
        <div className="admin-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="admin-modal-content admin-call-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedCall.subject}</h2>
              <button className="admin-modal-close" onClick={() => setSelectedCall(null)}>×</button>
            </div>
            <div className="admin-call-details">
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  value={selectedCall.status}
                  onChange={(e) => handleUpdateCall({ status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Resolution</label>
                <textarea
                  value={selectedCall.resolution || ''}
                  onChange={(e) => handleUpdateCall({ resolution: e.target.value })}
                  rows="3"
                  placeholder="Enter resolution details..."
                />
              </div>
              <div className="admin-form-group">
                <label>Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={selectedCall.rating || ''}
                  onChange={(e) => handleUpdateCall({ rating: parseInt(e.target.value) })}
                />
              </div>
              <div className="admin-form-group">
                <label>Feedback</label>
                <textarea
                  value={selectedCall.feedback || ''}
                  onChange={(e) => handleUpdateCall({ feedback: e.target.value })}
                  rows="3"
                  placeholder="Enter customer feedback..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomerService;

