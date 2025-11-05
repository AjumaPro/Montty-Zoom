import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiArrowDownTray, HiArrowPath, HiClock } from 'react-icons/hi2';
import { getActivityLogs, exportToCSV } from '../utils/adminAuthExtended';
import './AdminActivityLogs.css';

function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getActivityLogs(filters);
    setLogs(data);
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(loadLogs, 100);
  };

  const handleExport = () => {
    exportToCSV(logs, `activity_logs_${Date.now()}.csv`);
    toast.success('Activity logs exported successfully');
  };

  const getActionColor = (action) => {
    if (action.includes('delete') || action.includes('reject')) return '#ef4444';
    if (action.includes('create') || action.includes('approve')) return '#10b981';
    if (action.includes('update') || action.includes('grant')) return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div className="admin-logs-loading">
        <div className="admin-spinner"></div>
        <p>Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="admin-logs-container">
      <div className="admin-logs-header">
        <div>
          <h1 className="admin-page-title">Activity Logs</h1>
          <p className="admin-page-subtitle">Track all admin actions and system events</p>
        </div>
        <div className="admin-logs-header-right">
          <button className="admin-action-btn admin-btn-secondary" onClick={handleExport}>
            <HiArrowDownTray />
            Export CSV
          </button>
          <button className="admin-action-btn admin-btn-primary" onClick={loadLogs}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-logs-filters">
        <div className="admin-filter-row">
          <div className="admin-filter-group">
            <label>User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user ID"
            />
          </div>
          <div className="admin-filter-group">
            <label>Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Filter by action"
            />
          </div>
          <div className="admin-filter-group">
            <label>Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="package">Package</option>
              <option value="meeting">Meeting</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
        </div>
        <div className="admin-filter-row">
          <div className="admin-filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="admin-filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="admin-filter-actions">
            <button className="admin-action-btn admin-btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className="admin-action-btn admin-btn-secondary" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="admin-logs-list">
        {logs.length === 0 ? (
          <div className="admin-empty-state">
            <HiClock className="admin-empty-icon" />
            <p>No activity logs found</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="admin-log-item">
              <div className="admin-log-main">
                <div className="admin-log-action">
                  <span 
                    className="admin-log-action-badge"
                    style={{ backgroundColor: getActionColor(log.action) + '20', color: getActionColor(log.action) }}
                  >
                    {log.action}
                  </span>
                  <span className="admin-log-entity">
                    {log.entityType && `${log.entityType}: `}
                    {log.entityId || 'N/A'}
                  </span>
                </div>
                <div className="admin-log-user">
                  {log.userEmail || log.userId || 'System'}
                </div>
              </div>
              <div className="admin-log-meta">
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="admin-logs-footer">
        <p>Total Logs: {logs.length}</p>
      </div>
    </div>
  );
}

export default AdminActivityLogs;

