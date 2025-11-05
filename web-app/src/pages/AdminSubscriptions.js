import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiArrowDownTray, HiArrowPath } from 'react-icons/hi2';
import { getDetailedSubscriptions, exportToCSV } from '../utils/adminAuthExtended';
import './AdminSubscriptions.css';

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    const data = await getDetailedSubscriptions();
    setSubscriptions(data.subscriptions || []);
    setTotalRevenue(data.totalRevenue || 0);
    setLoading(false);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = (
      (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.plan_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    exportToCSV(filteredSubscriptions, `subscriptions_${Date.now()}.csv`);
    toast.success('Subscription data exported successfully');
  };

  const getPlanPrice = (planId) => {
    const prices = { free: 0, basic: 1.99, pro: 4.99, yearly: 50 };
    return prices[planId] || 0;
  };

  if (loading) {
    return (
      <div className="admin-subscriptions-loading">
        <div className="admin-spinner"></div>
        <p>Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="admin-subscriptions-container">
      <div className="admin-subscriptions-header">
        <div>
          <h1 className="admin-page-title">Subscriptions Management</h1>
          <p className="admin-page-subtitle">Manage all user subscriptions and track revenue</p>
        </div>
        <div className="admin-subscriptions-header-right">
          <div className="admin-revenue-card">
            <span className="admin-revenue-label">Total Revenue</span>
            <span className="admin-revenue-amount">${totalRevenue.toFixed(2)}</span>
          </div>
          <button className="admin-action-btn admin-btn-secondary" onClick={handleExport}>
            <HiArrowDownTray />
            Export CSV
          </button>
          <button className="admin-action-btn admin-btn-primary" onClick={loadSubscriptions}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-subscriptions-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <div className="admin-status-filters">
          <button
            className={`admin-status-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`admin-status-filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={`admin-status-filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="admin-subscriptions-table-container">
        <table className="admin-subscriptions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Billing Cycle</th>
              <th>Price</th>
              <th>Call Minutes</th>
              <th>Started</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-empty-state">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => (
                <tr key={sub.user_id}>
                  <td>
                    <div>
                      <div className="admin-user-name">{sub.name || sub.email || 'N/A'}</div>
                      <div className="admin-user-email">{sub.email || sub.user_id}</div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-plan-badge">{sub.plan_name || sub.plan_id}</span>
                  </td>
                  <td>
                    <span className={`admin-status-badge admin-status-${sub.status}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>{sub.billing_cycle || 'monthly'}</td>
                  <td>${getPlanPrice(sub.plan_id).toFixed(2)}</td>
                  <td>
                    {sub.call_minutes === -1 ? 'Unlimited' : `${sub.call_minutes_remaining || sub.call_minutes || 0} min`}
                  </td>
                  <td>{sub.started_at ? new Date(sub.started_at).toLocaleDateString() : 'N/A'}</td>
                  <td>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-subscriptions-footer">
        <p>Total Subscriptions: {filteredSubscriptions.length}</p>
      </div>
    </div>
  );
}

export default AdminSubscriptions;

