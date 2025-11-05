import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiPlus, 
  HiXCircle,
  HiCheckCircle,
  HiMagnifyingGlass,
  HiFunnel,
  HiChartBar,
  HiUsers,
  HiClock,
  HiGlobeAlt,
  HiArrowPath,
  HiEye,
  HiPencil,
  HiTrash,
  HiXMark
} from 'react-icons/hi2';
import { getFeatureFlags, createFeatureFlag } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminFeatureFlags.css';

function AdminFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    enabled: false, 
    targetPercentage: 100,
    rolloutStrategy: 'gradual', // immediate, gradual, a_b_test
    targetUsers: 'all', // all, specific, percentage
    conditions: [],
    environments: ['production']
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    const data = await getFeatureFlags();
    setFlags(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createFeatureFlag(formData);
    if (result) {
      toast.success(`Feature flag ${selectedFlag ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedFlag(null);
      setFormData({ 
        name: '', 
        description: '', 
        enabled: false, 
        targetPercentage: 100,
        rolloutStrategy: 'gradual',
        targetUsers: 'all',
        conditions: [],
        environments: ['production']
      });
      loadFlags();
    }
  };

  const handleToggleFlag = async (flag) => {
    // This would normally call an update API
    toast.info('Toggle functionality requires backend update endpoint');
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (flag.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && flag.enabled) ||
                         (filterStatus === 'disabled' && !flag.enabled);
    return matchesSearch && matchesStatus;
  });

  const enabledCount = flags.filter(f => f.enabled).length;
  const disabledCount = flags.filter(f => !f.enabled).length;

  if (loading) {
    return (
      <div className="admin-flags-loading">
        <div className="admin-spinner"></div>
        <p>Loading feature flags...</p>
      </div>
    );
  }

  return (
    <div className="admin-flags-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Feature Flags</h1>
          <p className="admin-page-subtitle">Control feature rollouts with A/B testing and gradual deployments</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => {
          setSelectedFlag(null);
          setShowModal(true);
        }}>
          <HiPlus />
          Add Flag
        </button>
      </div>

      {/* Statistics */}
      <div className="admin-flags-stats">
        <div className="admin-flag-stat-card">
          <div className="admin-flag-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <HiChartBar />
          </div>
          <div className="admin-flag-stat-info">
            <div className="admin-flag-stat-label">Total Flags</div>
            <div className="admin-flag-stat-value">{flags.length}</div>
          </div>
        </div>
        <div className="admin-flag-stat-card">
          <div className="admin-flag-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <HiCheckCircle />
          </div>
          <div className="admin-flag-stat-info">
            <div className="admin-flag-stat-label">Enabled</div>
            <div className="admin-flag-stat-value">{enabledCount}</div>
          </div>
        </div>
        <div className="admin-flag-stat-card">
          <div className="admin-flag-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <HiXCircle />
          </div>
          <div className="admin-flag-stat-info">
            <div className="admin-flag-stat-label">Disabled</div>
            <div className="admin-flag-stat-value">{disabledCount}</div>
          </div>
        </div>
        <div className="admin-flag-stat-card">
          <div className="admin-flag-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <HiUsers />
          </div>
          <div className="admin-flag-stat-info">
            <div className="admin-flag-stat-label">Active Rollouts</div>
            <div className="admin-flag-stat-value">
              {flags.filter(f => f.enabled && f.rolloutStrategy === 'gradual').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-flags-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search flags..."
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
            className={`admin-status-filter-btn ${filterStatus === 'enabled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('enabled')}
          >
            Enabled
          </button>
          <button
            className={`admin-status-filter-btn ${filterStatus === 'disabled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('disabled')}
          >
            Disabled
          </button>
        </div>
      </div>

      {/* Flags Grid */}
      <div className="admin-flags-grid">
        {filteredFlags.length === 0 ? (
          <div className="admin-empty-state admin-empty-state-large">
            <HiGlobeAlt className="admin-empty-icon" />
            <p>No feature flags found</p>
            <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
              <HiPlus />
              Create Your First Flag
            </button>
          </div>
        ) : (
          filteredFlags.map(flag => (
            <div key={flag.id || flag.name} className={`admin-flag-card ${flag.enabled ? 'enabled' : 'disabled'}`}>
              <div className="admin-flag-card-header">
                <div className="admin-flag-title-section">
                  <h3>{flag.name}</h3>
                  <div className="admin-flag-badges">
                    <span className={`admin-flag-status-badge ${flag.enabled ? 'enabled' : 'disabled'}`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {flag.rolloutStrategy && (
                      <span className="admin-flag-strategy-badge">
                        {flag.rolloutStrategy === 'gradual' ? 'Gradual' : 
                         flag.rolloutStrategy === 'a_b_test' ? 'A/B Test' : 'Immediate'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="admin-flag-card-actions">
                  <button 
                    className="admin-icon-btn"
                    onClick={() => {
                      setSelectedFlag(flag);
                      setFormData({ ...flag, rolloutStrategy: flag.rolloutStrategy || 'gradual' });
                      setShowModal(true);
                    }}
                    title="Edit"
                  >
                    <HiPencil />
                  </button>
                  <button 
                    className="admin-icon-btn admin-toggle-btn"
                    onClick={() => handleToggleFlag(flag)}
                    title={flag.enabled ? 'Disable' : 'Enable'}
                  >
                    {flag.enabled ? <HiCheckCircle /> : <HiXCircle />}
                  </button>
                </div>
              </div>
              
              <p className="admin-flag-description">{flag.description || 'No description'}</p>
              
              <div className="admin-flag-metrics">
                <div className="admin-flag-metric">
                  <span className="admin-flag-metric-label">Target:</span>
                  <span className="admin-flag-metric-value">{flag.target_percentage || flag.targetPercentage || 100}%</span>
                </div>
                {flag.environments && flag.environments.length > 0 && (
                  <div className="admin-flag-metric">
                    <span className="admin-flag-metric-label">Environments:</span>
                    <span className="admin-flag-metric-value">{flag.environments.join(', ')}</span>
                  </div>
                )}
              </div>

              {flag.enabled && flag.rolloutStrategy === 'gradual' && (
                <div className="admin-flag-rollout-progress">
                  <div className="admin-progress-bar">
                    <div 
                      className="admin-progress-fill"
                      style={{ width: `${flag.target_percentage || flag.targetPercentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="admin-progress-label">
                    {flag.target_percentage || flag.targetPercentage || 0}% deployed
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowModal(false);
          setSelectedFlag(null);
        }}>
          <div className="admin-modal-content admin-flag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}</h2>
              <button className="admin-modal-close" onClick={() => {
                setShowModal(false);
                setSelectedFlag(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Flag Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., new-dashboard-ui"
                />
              </div>
              
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Describe what this feature flag controls"
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Rollout Strategy</label>
                  <select
                    value={formData.rolloutStrategy}
                    onChange={(e) => setFormData({ ...formData, rolloutStrategy: e.target.value })}
                  >
                    <option value="immediate">Immediate (100%)</option>
                    <option value="gradual">Gradual Rollout</option>
                    <option value="a_b_test">A/B Test</option>
                  </select>
                </div>
                
                {formData.rolloutStrategy === 'gradual' && (
                  <div className="admin-form-group">
                    <label>Target Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.targetPercentage}
                      onChange={(e) => setFormData({ ...formData, targetPercentage: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label>Environments</label>
                <div className="admin-checkbox-group">
                  {['production', 'staging', 'development'].map(env => (
                    <label key={env} className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.environments.includes(env)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, environments: [...formData.environments, env] });
                          } else {
                            setFormData({ ...formData, environments: formData.environments.filter(e => e !== env) });
                          }
                        }}
                      />
                      <span>{env.charAt(0).toUpperCase() + env.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <span>Enable immediately</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => {
                  setShowModal(false);
                  setSelectedFlag(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  {selectedFlag ? 'Update' : 'Create'} Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeatureFlags;
