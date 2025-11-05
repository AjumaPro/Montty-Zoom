import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiPlus, 
  HiEye, 
  HiTrash,
  HiClipboardDocument,
  HiChartBar,
  HiShieldCheck,
  HiClock,
  HiMagnifyingGlass,
  HiFunnel,
  HiKey,
  HiXMark,
  HiArrowPath,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi2';
import { getApiKeys, createApiKey } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminApiKeys.css';

function AdminApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({ 
    keyName: '', 
    userId: '', 
    rateLimit: 1000,
    scopes: [],
    expiresIn: null,
    description: ''
  });

  const availableScopes = [
    { value: 'read', label: 'Read', description: 'Read-only access' },
    { value: 'write', label: 'Write', description: 'Create and update resources' },
    { value: 'delete', label: 'Delete', description: 'Delete resources' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
    { value: 'users', label: 'Users', description: 'Manage users' },
    { value: 'meetings', label: 'Meetings', description: 'Manage meetings' },
    { value: 'subscriptions', label: 'Subscriptions', description: 'Manage subscriptions' },
    { value: 'analytics', label: 'Analytics', description: 'Access analytics data' }
  ];

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    const data = await getApiKeys();
    setKeys(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createApiKey(formData);
    if (result && result.apiKey) {
      setNewKey(result.apiKey);
      setShowKeyModal(true);
      toast.success('API key created successfully');
      loadKeys();
      setShowModal(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleToggleScope = (scope) => {
    if (formData.scopes.includes(scope)) {
      setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope) });
    } else {
      setFormData({ ...formData, scopes: [...formData.scopes, scope] });
    }
  };

  const filteredKeys = keys.filter(key => {
    const matchesSearch = (key.key_name || key.keyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (key.user_id || key.userId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && key.active) ||
                         (filterStatus === 'inactive' && !key.active);
    return matchesSearch && matchesStatus;
  });

  const activeKeys = keys.filter(k => k.active).length;
  const totalRequests = keys.reduce((sum, k) => sum + (k.usage_count || k.usageCount || 0), 0);

  if (loading) {
    return (
      <div className="admin-api-keys-loading">
        <div className="admin-spinner"></div>
        <p>Loading API keys...</p>
      </div>
    );
  }

  return (
    <div className="admin-api-keys-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">API Keys Management</h1>
          <p className="admin-page-subtitle">Manage API keys with scopes, rate limits, and usage tracking</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => {
          setSelectedKey(null);
          setShowModal(true);
        }}>
          <HiPlus />
          Create Key
        </button>
      </div>

      {/* Statistics */}
      <div className="admin-api-keys-stats">
        <div className="admin-api-key-stat-card">
          <div className="admin-api-key-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <HiKey />
          </div>
          <div className="admin-api-key-stat-info">
            <div className="admin-api-key-stat-label">Total Keys</div>
            <div className="admin-api-key-stat-value">{keys.length}</div>
          </div>
        </div>
        <div className="admin-api-key-stat-card">
          <div className="admin-api-key-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <HiCheckCircle />
          </div>
          <div className="admin-api-key-stat-info">
            <div className="admin-api-key-stat-label">Active Keys</div>
            <div className="admin-api-key-stat-value">{activeKeys}</div>
          </div>
        </div>
        <div className="admin-api-key-stat-card">
          <div className="admin-api-key-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <HiChartBar />
          </div>
          <div className="admin-api-key-stat-info">
            <div className="admin-api-key-stat-label">Total Requests</div>
            <div className="admin-api-key-stat-value">{totalRequests.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-api-key-stat-card">
          <div className="admin-api-key-stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <HiClock />
          </div>
          <div className="admin-api-key-stat-info">
            <div className="admin-api-key-stat-label">Avg Rate Limit</div>
            <div className="admin-api-key-stat-value">
              {keys.length > 0 
                ? Math.round(keys.reduce((sum, k) => sum + (k.rate_limit || k.rateLimit || 0), 0) / keys.length)
                : 0}/hr
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-api-keys-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search keys..."
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
            className={`admin-status-filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="admin-api-keys-table-container">
        <table className="admin-api-keys-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>User ID</th>
              <th>Scopes</th>
              <th>Rate Limit</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.length === 0 ? (
              <tr>
                <td colSpan="9" className="admin-empty-cell">
                  <div className="admin-empty-state">
                    <HiKey className="admin-empty-icon" />
                    <p>No API keys found</p>
                    <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
                      <HiPlus />
                      Create Your First Key
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredKeys.map(key => (
                <tr key={key.id}>
                  <td>
                    <div className="admin-key-name-cell">
                      <strong>{key.key_name || key.keyName}</strong>
                      {key.description && (
                        <span className="admin-key-description">{key.description}</span>
                      )}
                    </div>
                  </td>
                  <td>{key.user_id || key.userId || 'N/A'}</td>
                  <td>
                    <div className="admin-scopes-cell">
                      {key.scopes && key.scopes.length > 0 ? (
                        key.scopes.slice(0, 2).map((scope, idx) => (
                          <span key={idx} className="admin-scope-tag">{scope}</span>
                        ))
                      ) : (
                        <span className="admin-scope-tag">read</span>
                      )}
                      {key.scopes && key.scopes.length > 2 && (
                        <span className="admin-scope-more">+{key.scopes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-rate-limit-cell">
                      <span>{key.rate_limit || key.rateLimit || 1000}</span>
                      <span className="admin-rate-unit">/hr</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-usage-cell">
                      <span className="admin-usage-count">{key.usage_count || key.usageCount || 0}</span>
                      {key.last_used && (
                        <span className="admin-last-used">
                          {new Date(key.last_used).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status-badge admin-status-${key.active ? 'active' : 'inactive'}`}>
                      {key.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{key.created_at ? new Date(key.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {key.expires_at ? (
                      <span className={new Date(key.expires_at) < new Date() ? 'admin-expired' : ''}>
                        {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="admin-no-expiry">Never</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-key-actions">
                      <button 
                        className="admin-icon-btn"
                        onClick={() => {
                          setSelectedKey(key);
                          setShowModal(true);
                        }}
                        title="View Details"
                      >
                        <HiEye />
                      </button>
                      <button 
                        className="admin-icon-btn admin-icon-btn-danger"
                        onClick={() => toast.info('Delete functionality requires backend endpoint')}
                        title="Delete"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowModal(false);
          setSelectedKey(null);
        }}>
          <div className="admin-modal-content admin-api-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedKey ? 'View API Key' : 'Create API Key'}</h2>
              <button className="admin-modal-close" onClick={() => {
                setShowModal(false);
                setSelectedKey(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Key Name *</label>
                <input
                  type="text"
                  value={formData.keyName}
                  onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
                  required
                  placeholder="e.g., Production API Key"
                  disabled={!!selectedKey}
                />
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  placeholder="Describe what this key is used for"
                  disabled={!!selectedKey}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>User ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="Restrict to specific user"
                    disabled={!!selectedKey}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Rate Limit (requests/hour) *</label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                    required
                    min="1"
                    disabled={!!selectedKey}
                  />
                </div>
              </div>

              {!selectedKey && (
                <>
                  <div className="admin-form-group">
                    <label>API Scopes *</label>
                    <div className="admin-scopes-selector">
                      {availableScopes.map(scope => (
                        <label key={scope.value} className="admin-scope-option">
                          <input
                            type="checkbox"
                            checked={formData.scopes.includes(scope.value)}
                            onChange={() => handleToggleScope(scope.value)}
                          />
                          <div className="admin-scope-option-content">
                            <span className="admin-scope-option-label">{scope.label}</span>
                            <span className="admin-scope-option-desc">{scope.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Expiration (Optional)</label>
                    <input
                      type="date"
                      value={formData.expiresIn || ''}
                      onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </>
              )}

              {selectedKey && (
                <div className="admin-key-details-section">
                  <h3>Key Details</h3>
                  <div className="admin-key-detail-item">
                    <label>Scopes:</label>
                    <div className="admin-scopes-display">
                      {(selectedKey.scopes || ['read']).map((scope, idx) => (
                        <span key={idx} className="admin-scope-tag">{scope}</span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-key-detail-item">
                    <label>Usage Count:</label>
                    <span>{selectedKey.usage_count || selectedKey.usageCount || 0}</span>
                  </div>
                  {selectedKey.last_used && (
                    <div className="admin-key-detail-item">
                      <label>Last Used:</label>
                      <span>{new Date(selectedKey.last_used).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => {
                  setShowModal(false);
                  setSelectedKey(null);
                }}>
                  {selectedKey ? 'Close' : 'Cancel'}
                </button>
                {!selectedKey && (
                  <button type="submit" className="admin-action-btn admin-btn-primary">
                    Create Key
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Display Modal */}
      {showKeyModal && newKey && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowKeyModal(false);
          setNewKey(null);
        }}>
          <div className="admin-modal-content admin-new-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>🔑 API Key Created Successfully</h2>
              <button className="admin-modal-close" onClick={() => {
                setShowKeyModal(false);
                setNewKey(null);
              }}>×</button>
            </div>
            <div className="admin-new-key-content">
              <div className="admin-warning-box">
                <HiShieldCheck className="admin-warning-icon" />
                <p><strong>Important:</strong> Copy this key now. You won't be able to see it again!</p>
              </div>
              
              <div className="admin-api-key-display">
                <code className="admin-api-key-value">{newKey}</code>
                <button 
                  className="admin-action-btn admin-btn-primary"
                  onClick={() => handleCopyKey(newKey)}
                >
                  <HiClipboardDocument />
                  Copy Key
                </button>
              </div>

              <div className="admin-key-info">
                <h3>Next Steps:</h3>
                <ul>
                  <li>Store this key securely</li>
                  <li>Never commit it to version control</li>
                  <li>Use environment variables in your application</li>
                  <li>Rotate keys regularly for security</li>
                </ul>
              </div>

              <div className="admin-modal-actions">
                <button 
                  className="admin-action-btn admin-btn-primary"
                  onClick={() => {
                    setShowKeyModal(false);
                    setNewKey(null);
                  }}
                >
                  I've Saved the Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApiKeys;
