import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { 
  HiPlus, 
  HiPhone, 
  HiUserGroup, 
  HiChartBar, 
  HiClock, 
  HiStar,
  HiArrowPath,
  HiMagnifyingGlass,
  HiPencil,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiXCircle,
  HiExclamationTriangle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiBell,
  HiXMark
} from 'react-icons/hi2';
import { 
  getCallCenterStats, 
  getCallCenterAgents, 
  createCallCenterAgent,
  getCustomerServiceCalls,
  updateCustomerServiceCall
} from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminCallCenter.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminCallCenter() {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [socket, setSocket] = useState(null);
  const callSoundRef = useRef(null);
  const [agentForm, setAgentForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'support',
    status: 'active'
  });

  // Initialize Socket.io connection for real-time call notifications
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    if (!userEmail || !userId) return;

    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to call center socket');
      // Join call center admin room
      newSocket.emit('join-call-center', { userEmail });
    });

    // Listen for new incoming calls
    newSocket.on('new-call', (data) => {
      console.log('New call received:', data);
      setIncomingCall(data.call);
      setShowCallAlert(true);
      playCallSound();
      
      // Auto-refresh data
      loadData();
      
      // Show toast notification
      toast.info(`📞 New ${data.call.callType} call from ${data.call.phoneNumber || data.call.userEmail}`, {
        position: 'top-right',
        autoClose: 5000,
        icon: '📞'
      });
    });

    // Listen for new support requests
    newSocket.on('new-support-request', (data) => {
      console.log('New support request:', data);
      setIncomingCall(data.call);
      setShowCallAlert(true);
      playCallSound();
      
      // Auto-refresh data
      loadData();
      
      // Show toast notification
      toast.info(`📧 New support request: ${data.call.subject}`, {
        position: 'top-right',
        autoClose: 5000,
        icon: '📧'
      });
    });

    // Listen for call status updates
    newSocket.on('call-status-updated', (data) => {
      console.log('Call status updated:', data);
      loadData();
      
      setIncomingCall(prev => {
        if (prev && prev.callId === data.callId) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });

    // Listen for call assignments
    newSocket.on('call-assigned', (data) => {
      console.log('Call assigned:', data);
      loadData();
      toast.success(`Call assigned to ${data.agentName}`, {
        position: 'top-right',
        autoClose: 3000
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play call sound (using Web Audio API)
  const playCallSound = () => {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play second beep after short delay
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 800;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 300);
    } catch (error) {
      console.error('Error playing call sound:', error);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, agentsData, callsData] = await Promise.all([
        getCallCenterStats(),
        getCallCenterAgents(),
        getCustomerServiceCalls()
      ]);
      setStats(statsData || { totalCalls: 0, activeCalls: 0, resolvedCalls: 0, avgCallDuration: 0, avgRating: 0, totalAgents: 0, activeAgents: 0 });
      setAgents(agentsData || []);
      // Get recent 5 calls
      setRecentCalls(callsData.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading call center data:', error);
      setStats({ totalCalls: 0, activeCalls: 0, resolvedCalls: 0, avgCallDuration: 0, avgRating: 0, totalAgents: 0, activeAgents: 0 });
      setAgents([]);
      setRecentCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    const result = await createCallCenterAgent(agentForm);
    if (result) {
      toast.success('Agent created successfully');
      setShowAgentModal(false);
      setAgentForm({ name: '', email: '', phone: '', department: 'support', status: 'active' });
      loadData();
    } else {
      toast.error('Failed to create agent');
    }
  };

  const handleAssignCall = async (callId, agentId, agentName) => {
    const result = await updateCustomerServiceCall(callId, {
      agentId,
      agentName,
      status: 'in_progress'
    });
    if (result) {
      toast.success('Call assigned successfully');
      loadData();
      setSelectedCall(null);
    }
  };

  const handleQuickAction = async (callId, action) => {
    const updates = {};
    if (action === 'resolve') {
      updates.status = 'resolved';
    } else if (action === 'close') {
      updates.status = 'closed';
    }
    
    const result = await updateCustomerServiceCall(callId, updates);
    if (result) {
      toast.success(`Call ${action === 'resolve' ? 'resolved' : 'closed'} successfully`);
      loadData();
      setSelectedCall(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#2563eb',
      resolved: '#10b981',
      closed: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const filteredAgents = agents.filter(agent => {
    const query = searchQuery.toLowerCase();
    return (
      (agent.name || '').toLowerCase().includes(query) ||
      (agent.email || '').toLowerCase().includes(query) ||
      (agent.department || '').toLowerCase().includes(query)
    );
  });

  const pendingCalls = recentCalls.filter(c => c.status === 'pending' || c.status === 'open');
  const activeCalls = recentCalls.filter(c => c.status === 'in_progress');

  if (loading) {
    return (
      <div className="admin-call-center-loading">
        <div className="admin-spinner"></div>
        <p>Loading call center data...</p>
      </div>
    );
  }

  return (
    <div className="admin-call-center-container">
      {/* Incoming Call Alert Banner */}
      {showCallAlert && incomingCall && (
        <div className="admin-incoming-call-alert">
          <div className="admin-call-alert-content">
            <div className="admin-call-alert-icon">
              <HiPhone className="admin-call-alert-phone-icon" />
              <div className="admin-call-alert-pulse"></div>
            </div>
            <div className="admin-call-alert-info">
              <h3 className="admin-call-alert-title">
                {incomingCall.callType === 'inbound' ? '📞 Incoming Call' : '📧 New Support Request'}
              </h3>
              <p className="admin-call-alert-subtitle">
                {incomingCall.phoneNumber || incomingCall.userEmail}
              </p>
              {incomingCall.subject && (
                <p className="admin-call-alert-subject">{incomingCall.subject}</p>
              )}
            </div>
            <div className="admin-call-alert-actions">
              <button
                className="admin-btn-call-action admin-btn-answer"
                onClick={() => {
                  setSelectedCall(incomingCall);
                  setShowCallAlert(false);
                }}
              >
                <HiEye /> View Details
              </button>
              <button
                className="admin-btn-call-action admin-btn-dismiss"
                onClick={() => {
                  setShowCallAlert(false);
                  setIncomingCall(null);
                }}
              >
                <HiXMark />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Call Center Dashboard</h1>
          <p className="admin-page-subtitle">Monitor and manage call center operations in real-time</p>
        </div>
        <div className="admin-call-center-header-actions">
          <button className="admin-action-btn admin-btn-secondary" onClick={loadData}>
            <HiArrowPath />
            Refresh
          </button>
          <button className="admin-action-btn admin-btn-primary" onClick={() => setShowAgentModal(true)}>
            <HiPlus />
            Add Agent
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="admin-call-center-stats-grid">
        <div className="admin-stat-card admin-stat-card-primary">
          <div className="admin-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <HiPhone />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Calls</div>
            <div className="admin-stat-value">{stats?.totalCalls || 0}</div>
            <div className="admin-stat-change positive">
              <HiArrowTrendingUp /> +12% from last week
            </div>
          </div>
        </div>
        <div className="admin-stat-card admin-stat-card-danger">
          <div className="admin-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <HiExclamationTriangle />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Pending Calls</div>
            <div className="admin-stat-value">{pendingCalls.length}</div>
            <div className="admin-stat-change">
              Needs attention
            </div>
          </div>
        </div>
        <div className="admin-stat-card admin-stat-card-success">
          <div className="admin-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <HiCheckCircle />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Resolved Today</div>
            <div className="admin-stat-value">{stats?.resolvedCalls || 0}</div>
            <div className="admin-stat-change positive">
              <HiArrowTrendingUp /> {stats?.resolvedCalls ? Math.round((stats.resolvedCalls / (stats.totalCalls || 1)) * 100) : 0}% resolution rate
            </div>
          </div>
        </div>
        <div className="admin-stat-card admin-stat-card-warning">
          <div className="admin-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <HiUserGroup />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Active Agents</div>
            <div className="admin-stat-value">{stats?.activeAgents || 0} / {stats?.totalAgents || 0}</div>
            <div className="admin-stat-change">
              {stats?.totalAgents > 0 ? Math.round((stats.activeAgents / stats.totalAgents) * 100) : 0}% available
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <HiClock />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Duration</div>
            <div className="admin-stat-value">{Math.round(stats?.avgCallDuration || 0)} min</div>
            <div className="admin-stat-change">
              Target: &lt;5 min
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
            <HiStar />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Rating</div>
            <div className="admin-stat-value">{stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0'}/5</div>
            <div className="admin-stat-change">
              Customer satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* Call Queue & Recent Calls */}
      <div className="admin-call-center-content-grid">
        <div className="admin-call-queue-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Call Queue</h2>
            <span className="admin-badge admin-badge-danger">{pendingCalls.length} Pending</span>
          </div>
          <div className="admin-call-queue-list">
            {pendingCalls.length === 0 ? (
              <div className="admin-empty-state">
                <HiCheckCircle className="admin-empty-icon" style={{ color: '#10b981' }} />
                <p>No pending calls</p>
              </div>
            ) : (
              pendingCalls.map(call => (
                <div key={call.id || call.call_id || call.callId} className="admin-call-queue-item">
                  <div className="admin-call-queue-main">
                    <div className="admin-call-queue-info">
                      <h4>{call.subject || 'No Subject'}</h4>
                      <p className="admin-call-queue-user">{call.user_email || call.userEmail || call.user_id}</p>
                    </div>
                    <div className="admin-call-queue-meta">
                      <span 
                        className="admin-priority-badge"
                        style={{ backgroundColor: getPriorityColor(call.priority || 'medium') + '20', color: getPriorityColor(call.priority || 'medium') }}
                      >
                        {call.priority || 'medium'}
                      </span>
                      <span className="admin-call-time">{new Date(call.created_at || call.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="admin-call-queue-actions">
                    <button 
                      className="admin-btn-small admin-btn-primary"
                      onClick={() => setSelectedCall(call)}
                    >
                      <HiEye /> View
                    </button>
                    {agents.length > 0 && (
                      <select 
                        className="admin-select-small"
                        onChange={(e) => {
                          if (e.target.value) {
                            const agent = agents.find(a => (a.agent_id || a.id) === e.target.value);
                            if (agent) {
                              handleAssignCall(call.call_id || call.callId, agent.agent_id || agent.id, agent.name);
                            }
                          }
                        }}
                      >
                        <option value="">Assign to...</option>
                        {agents.filter(a => a.status === 'active').map(agent => (
                          <option key={agent.agent_id || agent.id} value={agent.agent_id || agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-recent-calls-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Calls</h2>
            <button className="admin-link-btn" onClick={() => window.location.hash = '#customer-service'}>
              View All →
            </button>
          </div>
          <div className="admin-recent-calls-list">
            {recentCalls.length === 0 ? (
              <div className="admin-empty-state">
                <p>No recent calls</p>
              </div>
            ) : (
              recentCalls.map(call => (
                <div key={call.id || call.call_id || call.callId} className="admin-recent-call-item" onClick={() => setSelectedCall(call)}>
                  <div className="admin-recent-call-status" style={{ backgroundColor: getStatusColor(call.status) + '20', color: getStatusColor(call.status) }}>
                    <div className="admin-status-dot" style={{ backgroundColor: getStatusColor(call.status) }}></div>
                    {call.status}
                  </div>
                  <div className="admin-recent-call-info">
                    <h4>{call.subject || 'No Subject'}</h4>
                    <p>{call.user_email || call.userEmail || call.user_id}</p>
                    {call.agent_name && <p className="admin-agent-name">Agent: {call.agent_name}</p>}
                  </div>
                  <div className="admin-recent-call-time">
                    {new Date(call.created_at || call.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Agents Section */}
      <div className="admin-agents-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Call Center Agents</h2>
          <div className="admin-search-box admin-search-box-small">
            <HiMagnifyingGlass className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>
        <div className="admin-agents-grid">
          {filteredAgents.length === 0 ? (
            <div className="admin-empty-state admin-empty-state-large">
              <HiUserGroup className="admin-empty-icon" />
              <p>No agents found</p>
              <button className="admin-action-btn admin-btn-primary" onClick={() => setShowAgentModal(true)}>
                <HiPlus />
                Add Your First Agent
              </button>
            </div>
          ) : (
            filteredAgents.map(agent => (
              <div key={agent.id || agent.agent_id} className="admin-agent-card admin-agent-card-enhanced">
                <div className="admin-agent-header">
                  <div className="admin-agent-avatar">
                    {agent.name.charAt(0).toUpperCase()}
                    {agent.status === 'active' && <span className="admin-agent-status-indicator"></span>}
                  </div>
                  <div className="admin-agent-info-header">
                    <h3>{agent.name}</h3>
                    <p className="admin-agent-email">{agent.email}</p>
                  </div>
                  <div className="admin-agent-actions">
                    <button 
                      className="admin-icon-btn"
                      onClick={() => setSelectedAgent(agent)}
                      title="View Details"
                    >
                      <HiEye />
                    </button>
                  </div>
                </div>
                <div className="admin-agent-details">
                  <div className="admin-agent-info-row">
                    <span className="admin-agent-label">Department:</span>
                    <span className="admin-department-badge">{agent.department || 'Support'}</span>
                  </div>
                  <div className="admin-agent-info-row">
                    <span className="admin-agent-label">Status:</span>
                    <span className={`admin-status-badge admin-status-${agent.status}`}>
                      {agent.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="admin-agent-performance">
                    <div className="admin-performance-metric">
                      <span className="admin-metric-label">Total Calls</span>
                      <span className="admin-metric-value">{agent.total_calls || agent.totalCalls || 0}</span>
                    </div>
                    <div className="admin-performance-metric">
                      <span className="admin-metric-label">Avg Rating</span>
                      <span className="admin-metric-value">
                        {agent.avg_rating || agent.avgRating ? (agent.avg_rating || agent.avgRating).toFixed(1) : 'N/A'}
                        {agent.avg_rating >= 4 && <HiStar className="admin-star-icon" />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAgentModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add Call Center Agent</h2>
              <button className="admin-modal-close" onClick={() => setShowAgentModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateAgent}>
              <div className="admin-form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  required
                  placeholder="Agent full name"
                />
              </div>
              <div className="admin-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  required
                  placeholder="agent@example.com"
                />
              </div>
              <div className="admin-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="admin-form-group">
                <label>Department</label>
                <select
                  value={agentForm.department}
                  onChange={(e) => setAgentForm({ ...agentForm, department: e.target.value })}
                >
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowAgentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="admin-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="admin-modal-content admin-call-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedCall.subject || 'Call Details'}</h2>
              <button className="admin-modal-close" onClick={() => setSelectedCall(null)}>×</button>
            </div>
            <div className="admin-call-details-content">
              <div className="admin-call-detail-section">
                <h3>Call Information</h3>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <label>Status</label>
                    <span className="admin-call-status" style={{ backgroundColor: getStatusColor(selectedCall.status) + '20', color: getStatusColor(selectedCall.status) }}>
                      {selectedCall.status}
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <label>Priority</label>
                    <span className="admin-priority-badge" style={{ backgroundColor: getPriorityColor(selectedCall.priority || 'medium') + '20', color: getPriorityColor(selectedCall.priority || 'medium') }}>
                      {selectedCall.priority || 'medium'}
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <label>Customer</label>
                    <span>{selectedCall.user_email || selectedCall.userEmail || selectedCall.user_id}</span>
                  </div>
                  <div className="admin-detail-item">
                    <label>Agent</label>
                    <span>{selectedCall.agent_name || selectedCall.agentName || 'Unassigned'}</span>
                  </div>
                  <div className="admin-detail-item">
                    <label>Duration</label>
                    <span>{selectedCall.duration || 0} minutes</span>
                  </div>
                  <div className="admin-detail-item">
                    <label>Created</label>
                    <span>{new Date(selectedCall.created_at || selectedCall.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="admin-call-detail-section">
                <h3>Description</h3>
                <p className="admin-call-description-full">{selectedCall.description || 'No description provided'}</p>
              </div>

              {selectedCall.resolution && (
                <div className="admin-call-detail-section">
                  <h3>Resolution</h3>
                  <p className="admin-call-resolution">{selectedCall.resolution}</p>
                </div>
              )}

              {selectedCall.feedback && (
                <div className="admin-call-detail-section">
                  <h3>Customer Feedback</h3>
                  <div className="admin-call-feedback">
                    {selectedCall.rating && (
                      <div className="admin-rating-display">
                        {[...Array(5)].map((_, i) => (
                          <HiStar 
                            key={i} 
                            className={i < selectedCall.rating ? 'admin-star-filled' : 'admin-star-empty'} 
                          />
                        ))}
                        <span>({selectedCall.rating}/5)</span>
                      </div>
                    )}
                    <p>{selectedCall.feedback}</p>
                  </div>
                </div>
              )}

              <div className="admin-call-detail-actions">
                {!selectedCall.agent_name && agents.length > 0 && (
                  <select 
                    className="admin-select-medium"
                    onChange={(e) => {
                      if (e.target.value) {
                        const agent = agents.find(a => (a.agent_id || a.id) === e.target.value);
                        if (agent) {
                          handleAssignCall(selectedCall.call_id || selectedCall.callId, agent.agent_id || agent.id, agent.name);
                        }
                      }
                    }}
                  >
                    <option value="">Assign to Agent...</option>
                    {agents.filter(a => a.status === 'active').map(agent => (
                      <option key={agent.agent_id || agent.id} value={agent.agent_id || agent.id}>
                        {agent.name} - {agent.department}
                      </option>
                    ))}
                  </select>
                )}
                {selectedCall.status !== 'resolved' && (
                  <button 
                    className="admin-action-btn admin-btn-success"
                    onClick={() => handleQuickAction(selectedCall.call_id || selectedCall.callId, 'resolve')}
                  >
                    <HiCheckCircle />
                    Mark Resolved
                  </button>
                )}
                {selectedCall.status !== 'closed' && (
                  <button 
                    className="admin-action-btn admin-btn-secondary"
                    onClick={() => handleQuickAction(selectedCall.call_id || selectedCall.callId, 'close')}
                  >
                    <HiXCircle />
                    Close Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCallCenter;
