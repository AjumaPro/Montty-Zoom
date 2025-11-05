import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiMagnifyingGlass, 
  HiPencil, 
  HiXMark,
  HiPlus,
  HiUserGroup,
  HiClock,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowPath,
  HiPaperAirplane,
  HiTag,
  HiFunnel,
  HiCalendar,
  HiChartBar,
  HiArrowDownTray,
  HiBolt
} from 'react-icons/hi2';
import { getSupportTickets, updateSupportTicket, addTicketMessage } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminSupportTickets.css';

function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list, kanban

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    setLoading(true);
    const data = await getSupportTickets(statusFilter === 'all' ? null : statusFilter);
    
    // Enhance with SLA calculations
    const enhancedData = (data || []).map(ticket => {
      const createdAt = new Date(ticket.created_at || ticket.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      // SLA: 4 hours for high priority, 24 hours for normal
      const slaHours = ticket.priority === 'high' || ticket.priority === 'urgent' ? 4 : 24;
      const slaStatus = hoursSinceCreation > slaHours ? 'breached' : 
                       hoursSinceCreation > slaHours * 0.8 ? 'warning' : 'ok';
      
      return {
        ...ticket,
        hoursSinceCreation: Math.round(hoursSinceCreation * 10) / 10,
        slaHours,
        slaStatus,
        timeRemaining: Math.max(0, slaHours - hoursSinceCreation)
      };
    });
    
    setTickets(enhancedData);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !message.trim()) return;
    const result = await addTicketMessage(selectedTicket.id || selectedTicket.ticket_number, message);
    if (result) {
      toast.success('Message sent successfully');
      setMessage('');
      loadTickets();
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    const result = await updateSupportTicket(ticketId, { status });
    if (result) {
      toast.success('Ticket updated successfully');
      loadTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    }
  };

  const handleUpdatePriority = async (ticketId, priority) => {
    const result = await updateSupportTicket(ticketId, { priority });
    if (result) {
      toast.success('Priority updated successfully');
      loadTickets();
    }
  };

  const handleAssignTicket = async (ticketId, agentId, agentName) => {
    const result = await updateSupportTicket(ticketId, { assignedTo: agentId, assignedToName: agentName });
    if (result) {
      toast.success(`Ticket assigned to ${agentName}`);
      loadTickets();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#2563eb',
      in_progress: '#f59e0b',
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

  const getSlaColor = (slaStatus) => {
    const colors = {
      ok: '#10b981',
      warning: '#f59e0b',
      breached: '#ef4444'
    };
    return colors[slaStatus] || '#6b7280';
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ticket.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ticket.user_email || ticket.user_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSla = slaFilter === 'all' || ticket.slaStatus === slaFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesSla;
  });

  const ticketsByStatus = {
    open: filteredTickets.filter(t => t.status === 'open'),
    in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
    resolved: filteredTickets.filter(t => t.status === 'resolved'),
    closed: filteredTickets.filter(t => t.status === 'closed')
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    slaBreached: tickets.filter(t => t.slaStatus === 'breached').length
  };

  if (loading) {
    return (
      <div className="admin-tickets-loading">
        <div className="admin-spinner"></div>
        <p>Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="admin-tickets-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Support Tickets</h1>
          <p className="admin-page-subtitle">Manage customer support with SLA tracking and automation</p>
        </div>
        <div className="admin-tickets-header-actions">
          <button className="admin-action-btn admin-btn-secondary" onClick={loadTickets}>
            <HiArrowPath />
            Refresh
          </button>
          <button className="admin-action-btn admin-btn-primary">
            <HiPlus />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="admin-tickets-stats">
        <div className="admin-ticket-stat-card">
          <div className="admin-ticket-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <HiTag />
          </div>
          <div className="admin-ticket-stat-info">
            <div className="admin-ticket-stat-label">Total Tickets</div>
            <div className="admin-ticket-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="admin-ticket-stat-card">
          <div className="admin-ticket-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <HiExclamationTriangle />
          </div>
          <div className="admin-ticket-stat-info">
            <div className="admin-ticket-stat-label">Open</div>
            <div className="admin-ticket-stat-value">{stats.open}</div>
          </div>
        </div>
        <div className="admin-ticket-stat-card">
          <div className="admin-ticket-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <HiClock />
          </div>
          <div className="admin-ticket-stat-info">
            <div className="admin-ticket-stat-label">In Progress</div>
            <div className="admin-ticket-stat-value">{stats.inProgress}</div>
          </div>
        </div>
        <div className="admin-ticket-stat-card">
          <div className="admin-ticket-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <HiBolt />
          </div>
          <div className="admin-ticket-stat-info">
            <div className="admin-ticket-stat-label">SLA Breached</div>
            <div className="admin-ticket-stat-value">{stats.slaBreached}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-tickets-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search tickets..."
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
            className={`admin-status-filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            Open ({stats.open})
          </button>
          <button
            className={`admin-status-filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            className={`admin-status-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved ({stats.resolved})
          </button>
        </div>
        <select 
          className="admin-select-medium"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select 
          className="admin-select-medium"
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value)}
        >
          <option value="all">All SLA Status</option>
          <option value="ok">On Time</option>
          <option value="warning">Warning</option>
          <option value="breached">Breached</option>
        </select>
      </div>

      {/* View Mode Toggle */}
      <div className="admin-view-mode-toggle">
        <button
          className={`admin-view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button
          className={`admin-view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          Kanban View
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="admin-tickets-list">
          {filteredTickets.length === 0 ? (
            <div className="admin-empty-state admin-empty-state-large">
              <HiTag className="admin-empty-icon" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                className={`admin-ticket-card ${ticket.slaStatus === 'breached' ? 'sla-breached' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="admin-ticket-card-header">
                  <div className="admin-ticket-title-section">
                    <h3>{ticket.subject}</h3>
                    <div className="admin-ticket-badges">
                      <span 
                        className="admin-ticket-status"
                        style={{ backgroundColor: getStatusColor(ticket.status) + '20', color: getStatusColor(ticket.status) }}
                      >
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span 
                          className="admin-ticket-priority"
                          style={{ backgroundColor: getPriorityColor(ticket.priority) + '20', color: getPriorityColor(ticket.priority) }}
                        >
                          {ticket.priority}
                        </span>
                      )}
                      {ticket.slaStatus && (
                        <span 
                          className="admin-ticket-sla"
                          style={{ backgroundColor: getSlaColor(ticket.slaStatus) + '20', color: getSlaColor(ticket.slaStatus) }}
                        >
                          SLA: {ticket.slaStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="admin-ticket-time-info">
                    <span className="admin-ticket-hours">{ticket.hoursSinceCreation}h ago</span>
                    {ticket.timeRemaining > 0 && (
                      <span className="admin-ticket-remaining">{ticket.timeRemaining.toFixed(1)}h remaining</span>
                    )}
                  </div>
                </div>
                <p className="admin-ticket-preview">{ticket.description.substring(0, 150)}...</p>
                <div className="admin-ticket-meta">
                  <span>{ticket.user_email || ticket.user_id}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.assigned_to_name && <span>Assigned: {ticket.assigned_to_name}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="admin-tickets-kanban">
          {Object.entries(ticketsByStatus).map(([status, statusTickets]) => (
            <div key={status} className="admin-kanban-column">
              <div className="admin-kanban-header">
                <h3>{status.replace('_', ' ').toUpperCase()}</h3>
                <span className="admin-kanban-count">{statusTickets.length}</span>
              </div>
              <div className="admin-kanban-cards">
                {statusTickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    className={`admin-kanban-card ${ticket.slaStatus === 'breached' ? 'sla-breached' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="admin-kanban-card-header">
                      <h4>{ticket.subject}</h4>
                      {ticket.priority && (
                        <span 
                          className="admin-kanban-priority"
                          style={{ backgroundColor: getPriorityColor(ticket.priority) + '20', color: getPriorityColor(ticket.priority) }}
                        >
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <p className="admin-kanban-preview">{ticket.description.substring(0, 100)}...</p>
                    <div className="admin-kanban-footer">
                      <span className="admin-kanban-user">{ticket.user_email || ticket.user_id}</span>
                      <span className="admin-kanban-time">{ticket.hoursSinceCreation}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="admin-modal-content admin-ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>{selectedTicket.subject}</h2>
                <div className="admin-ticket-modal-badges">
                  <span 
                    className="admin-ticket-status"
                    style={{ backgroundColor: getStatusColor(selectedTicket.status) + '20', color: getStatusColor(selectedTicket.status) }}
                  >
                    {selectedTicket.status}
                  </span>
                  {selectedTicket.priority && (
                    <span 
                      className="admin-ticket-priority"
                      style={{ backgroundColor: getPriorityColor(selectedTicket.priority) + '20', color: getPriorityColor(selectedTicket.priority) }}
                    >
                      {selectedTicket.priority}
                    </span>
                  )}
                  {selectedTicket.slaStatus && (
                    <span 
                      className="admin-ticket-sla"
                      style={{ backgroundColor: getSlaColor(selectedTicket.slaStatus) + '20', color: getSlaColor(selectedTicket.slaStatus) }}
                    >
                      SLA: {selectedTicket.slaStatus.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedTicket(null)}>
                <HiXMark />
              </button>
            </div>
            <div className="admin-ticket-details">
              <div className="admin-ticket-info-grid">
                <div className="admin-ticket-info-item">
                  <label>Customer:</label>
                  <span>{selectedTicket.user_email || selectedTicket.user_id}</span>
                </div>
                <div className="admin-ticket-info-item">
                  <label>Created:</label>
                  <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                <div className="admin-ticket-info-item">
                  <label>Age:</label>
                  <span>{selectedTicket.hoursSinceCreation} hours</span>
                </div>
                {selectedTicket.timeRemaining > 0 && (
                  <div className="admin-ticket-info-item">
                    <label>Time Remaining:</label>
                    <span className={selectedTicket.slaStatus === 'warning' ? 'admin-warning-text' : ''}>
                      {selectedTicket.timeRemaining.toFixed(1)} hours
                    </span>
                  </div>
                )}
              </div>

              <div className="admin-ticket-description-section">
                <h3>Description</h3>
                <p>{selectedTicket.description}</p>
              </div>

              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div className="admin-ticket-messages-section">
                  <h3>Conversation</h3>
                  <div className="admin-ticket-messages-list">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div key={idx} className="admin-ticket-message">
                        <div className="admin-message-header">
                          <span className="admin-message-author">{msg.author || 'Support'}</span>
                          <span className="admin-message-time">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="admin-message-content">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin-ticket-response">
                <label>Response</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows="4"
                  className="admin-textarea-medium"
                />
                <div className="admin-ticket-actions">
                  <div className="admin-ticket-action-group">
                    <label>Update Status:</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      className="admin-select-medium"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="admin-ticket-action-group">
                    <label>Priority:</label>
                    <select
                      value={selectedTicket.priority || 'medium'}
                      onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value)}
                      className="admin-select-medium"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <button className="admin-action-btn admin-btn-primary" onClick={handleSendMessage}>
                    <HiPaperAirplane />
                    Send Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSupportTickets;
