import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiArrowDownTray, HiArrowPath, HiCurrencyDollar } from 'react-icons/hi2';
import { getPayments, createPayment, exportToCSV } from '../utils/adminAuthExtended';
import './AdminPayments.css';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    userId: '',
    amount: '',
    planId: '',
    billingCycle: 'monthly',
    status: 'completed'
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    const result = await createPayment(newPayment);
    if (result) {
      toast.success('Payment created successfully');
      setShowCreateModal(false);
      setNewPayment({ userId: '', amount: '', planId: '', billingCycle: 'monthly', status: 'completed' });
      loadPayments();
    } else {
      toast.error('Failed to create payment');
    }
  };

  const handleExport = () => {
    exportToCSV(payments, `payments_${Date.now()}.csv`);
    toast.success('Payment data exported successfully');
  };

  const filteredPayments = payments.filter(payment => {
    const query = searchQuery.toLowerCase();
    return (
      (payment.user_id || '').toLowerCase().includes(query) ||
      (payment.transaction_id || '').toLowerCase().includes(query) ||
      (payment.email || '').toLowerCase().includes(query)
    );
  });

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  if (loading) {
    return (
      <div className="admin-payments-loading">
        <div className="admin-spinner"></div>
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="admin-payments-container">
      <div className="admin-payments-header">
        <div>
          <h1 className="admin-page-title">Payment Management</h1>
          <p className="admin-page-subtitle">View and manage payment transactions</p>
        </div>
        <div className="admin-payments-header-right">
          <div className="admin-revenue-card">
            <span className="admin-revenue-label">Total Revenue</span>
            <span className="admin-revenue-amount">${totalRevenue.toFixed(2)}</span>
          </div>
          <button className="admin-action-btn admin-btn-secondary" onClick={handleExport}>
            <HiArrowDownTray />
            Export CSV
          </button>
          <button className="admin-action-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <HiCurrencyDollar />
            Add Payment
          </button>
          <button className="admin-action-btn admin-btn-secondary" onClick={loadPayments}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-search-box" style={{ marginBottom: '24px' }}>
        <HiMagnifyingGlass className="admin-search-icon" />
        <input
          type="text"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-payments-table-container">
        <table className="admin-payments-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-empty-state">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id || payment.transaction_id}>
                  <td className="admin-transaction-id">{payment.transaction_id || 'N/A'}</td>
                  <td>
                    <div>
                      <div className="admin-user-name">{payment.name || 'N/A'}</div>
                      <div className="admin-user-email">{payment.email || payment.user_id}</div>
                    </div>
                  </td>
                  <td className="admin-payment-amount">${parseFloat(payment.amount || 0).toFixed(2)}</td>
                  <td>{payment.plan_id || 'N/A'}</td>
                  <td>
                    <span className={`admin-status-badge admin-status-${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Create Payment</h2>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePayment} className="admin-payment-form">
              <div className="admin-form-group">
                <label>User ID *</label>
                <input
                  type="text"
                  value={newPayment.userId}
                  onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Plan ID</label>
                <select
                  value={newPayment.planId}
                  onChange={(e) => setNewPayment({ ...newPayment, planId: e.target.value })}
                >
                  <option value="">Select Plan</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Billing Cycle</label>
                <select
                  value={newPayment.billingCycle}
                  onChange={(e) => setNewPayment({ ...newPayment, billingCycle: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  Create Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;

