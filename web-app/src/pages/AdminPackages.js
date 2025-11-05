import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiPencil, HiTrash, HiXMark, HiPlus } from 'react-icons/hi2';
import { getPackages, createPackage, updatePackage, deletePackage } from '../utils/adminAuth';
import './AdminPackages.css';

function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    price: '',
    billing: 'monthly',
    description: '',
    features: [],
    limitations: {
      maxParticipants: -1,
      maxCallMinutes: null,
      maxMeetingsPerMonth: null,
      recording: false,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      apiAccess: false
    },
    callMinutes: '',
    popular: false,
    active: true
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    const data = await getPackages();
    setPackages(data);
    setLoading(false);
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        planId: pkg.planId,
        name: pkg.name,
        price: pkg.price.toString(),
        billing: pkg.billing,
        description: pkg.description || '',
        features: pkg.features || [],
        limitations: pkg.limitations || {
          maxParticipants: -1,
          maxCallMinutes: null,
          maxMeetingsPerMonth: null,
          recording: false,
          customBranding: false,
          prioritySupport: false,
          advancedFeatures: false,
          apiAccess: false
        },
        callMinutes: pkg.callMinutes === -1 ? 'unlimited' : pkg.callMinutes.toString(),
        popular: pkg.popular || false,
        active: pkg.active !== false
      });
    } else {
      setEditingPackage(null);
      setFormData({
        planId: '',
        name: '',
        price: '',
        billing: 'monthly',
        description: '',
        features: [],
        limitations: {
          maxParticipants: -1,
          maxCallMinutes: null,
          maxMeetingsPerMonth: null,
          recording: false,
          customBranding: false,
          prioritySupport: false,
          advancedFeatures: false,
          apiAccess: false
        },
        callMinutes: '',
        popular: false,
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFeatureInput('');
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        callMinutes: formData.callMinutes === 'unlimited' || formData.callMinutes === '-1' 
          ? -1 
          : parseInt(formData.callMinutes)
      };

      if (editingPackage) {
        await updatePackage(editingPackage.planId, submitData);
        toast.success('Package updated successfully');
      } else {
        await createPackage(submitData);
        toast.success('Package created successfully');
      }
      
      handleCloseModal();
      loadPackages();
    } catch (error) {
      toast.error(error.message || 'Failed to save package');
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this package? This will deactivate it.')) {
      return;
    }
    
    const result = await deletePackage(planId);
    if (result) {
      toast.success('Package deleted successfully');
      loadPackages();
    } else {
      toast.error('Failed to delete package');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const query = searchQuery.toLowerCase();
    return (
      (pkg.name || '').toLowerCase().includes(query) ||
      (pkg.planId || '').toLowerCase().includes(query) ||
      (pkg.description || '').toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="admin-packages-loading">
        <div className="admin-spinner"></div>
        <p>Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="admin-packages-container">
      <div className="admin-packages-header">
        <div>
          <h1 className="admin-page-title">Packages Management</h1>
          <p className="admin-page-subtitle">Manage pricing plans and subscriptions</p>
        </div>
        <div className="admin-packages-header-right">
          <div className="admin-search-box">
            <HiMagnifyingGlass className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button
            className="admin-action-btn admin-btn-primary"
            onClick={() => handleOpenModal()}
          >
            <HiPlus />
            Add Package
          </button>
        </div>
      </div>

      <div className="admin-packages-grid">
        {filteredPackages.length === 0 ? (
          <div className="admin-empty-state">
            <p>No packages found</p>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <div key={pkg.planId} className={`admin-package-card ${!pkg.active ? 'inactive' : ''}`}>
              {pkg.popular && (
                <div className="admin-package-popular-badge">Popular</div>
              )}
              {!pkg.active && (
                <div className="admin-package-inactive-badge">Inactive</div>
              )}
              <div className="admin-package-card-header">
                <h3>{pkg.name}</h3>
                <div className="admin-package-price">
                  {pkg.price === 0 ? (
                    <span className="admin-price-free">Free</span>
                  ) : (
                    <>
                      <span className="admin-price-amount">${pkg.price}</span>
                      <span className="admin-price-period">/{pkg.billing === 'yearly' ? 'year' : 'month'}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="admin-package-description">{pkg.description}</p>
              <div className="admin-package-details">
                <div className="admin-package-detail-item">
                  <span className="admin-detail-label">Call Minutes:</span>
                  <span className="admin-detail-value">
                    {pkg.callMinutes === -1 ? 'Unlimited' : `${pkg.callMinutes} min`}
                  </span>
                </div>
                <div className="admin-package-detail-item">
                  <span className="admin-detail-label">Features:</span>
                  <span className="admin-detail-value">{pkg.features?.length || 0}</span>
                </div>
              </div>
              <div className="admin-package-actions">
                <button
                  className="admin-icon-btn"
                  onClick={() => handleOpenModal(pkg)}
                  title="Edit"
                >
                  <HiPencil />
                </button>
                <button
                  className="admin-icon-btn admin-icon-btn-danger"
                  onClick={() => handleDelete(pkg.planId)}
                  title="Delete"
                >
                  <HiTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Package Form Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal-content admin-package-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingPackage ? 'Edit Package' : 'Create New Package'}</h2>
              <button className="admin-modal-close" onClick={handleCloseModal}>
                <HiXMark />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-package-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Plan ID *</label>
                  <input
                    type="text"
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    required
                    disabled={!!editingPackage}
                    placeholder="e.g., enterprise"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Package Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Enterprise"
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Billing Cycle *</label>
                  <select
                    value={formData.billing}
                    onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Package description..."
                />
              </div>

              <div className="admin-form-group">
                <label>Call Minutes *</label>
                <input
                  type="text"
                  value={formData.callMinutes}
                  onChange={(e) => setFormData({ ...formData, callMinutes: e.target.value })}
                  required
                  placeholder="-1 for unlimited or number of minutes"
                />
              </div>

              <div className="admin-form-group">
                <label>Features</label>
                <div className="admin-features-input">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add a feature and press Enter"
                  />
                  <button type="button" onClick={handleAddFeature} className="admin-btn-add-feature">
                    <HiPlus />
                  </button>
                </div>
                <div className="admin-features-list">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="admin-feature-tag">
                      <span>{feature}</span>
                      <button type="button" onClick={() => handleRemoveFeature(index)}>
                        <HiXMark />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    />
                    Mark as Popular
                  </label>
                </div>
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-action-btn admin-btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-action-btn admin-btn-primary"
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPackages;

