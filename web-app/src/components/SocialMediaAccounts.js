import React, { useState, useEffect } from 'react';
import {
  HiXMark,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheckCircle,
  HiVideoCamera,
  HiGlobeAlt,
  HiShieldCheck
} from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './SocialMediaAccounts.css';

function SocialMediaAccounts({ isOpen, onClose, onSelectAccount }) {
  const [accounts, setAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    rtmpUrl: '',
    streamKey: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = () => {
    try {
      const savedAccounts = JSON.parse(localStorage.getItem('socialMediaAccounts') || '[]');
      setAccounts(savedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const saveAccounts = (updatedAccounts) => {
    try {
      localStorage.setItem('socialMediaAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error('Error saving accounts:', error);
      toast.error('Failed to save account');
    }
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      platform: '',
      rtmpUrl: '',
      streamKey: '',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name || '',
      platform: account.platform || '',
      rtmpUrl: account.rtmpUrl || '',
      streamKey: account.streamKey || '',
      description: account.description || ''
    });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.rtmpUrl.trim()) {
      toast.error('Please fill in account name and RTMP URL');
      return;
    }

    const accountData = {
      id: editingAccount?.id || `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      platform: formData.platform || 'custom',
      rtmpUrl: formData.rtmpUrl.trim(),
      streamKey: formData.streamKey.trim(),
      description: formData.description.trim(),
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedAccounts;
    if (editingAccount) {
      updatedAccounts = accounts.map(acc => 
        acc.id === editingAccount.id ? accountData : acc
      );
      toast.success('Account updated successfully');
    } else {
      updatedAccounts = [...accounts, accountData];
      toast.success('Account added successfully');
    }

    saveAccounts(updatedAccounts);
    setShowAddModal(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      platform: '',
      rtmpUrl: '',
      streamKey: '',
      description: ''
    });
  };

  const handleDelete = (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      saveAccounts(updatedAccounts);
      toast.success('Account deleted successfully');
    }
  };

  const handleSelect = (account) => {
    if (onSelectAccount) {
      onSelectAccount(account);
    }
    onClose();
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return '📺';
      case 'facebook':
        return '📘';
      case 'twitch':
        return '🎮';
      case 'instagram':
        return '📷';
      default:
        return '🌐';
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'youtube':
        return 'YouTube';
      case 'facebook':
        return 'Facebook';
      case 'twitch':
        return 'Twitch';
      case 'instagram':
        return 'Instagram';
      default:
        return 'Custom';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="social-accounts-overlay" onClick={onClose}>
      <div className="social-accounts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="social-accounts-header">
          <h2>Social Media Accounts</h2>
          <button className="social-accounts-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="social-accounts-content">
          <div className="social-accounts-actions">
            <button className="btn-add-account" onClick={handleOpenAdd}>
              <HiPlus />
              Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-accounts">
              <HiVideoCamera className="empty-icon" />
              <h3>No accounts added yet</h3>
              <p>Add your social media streaming accounts to quickly start streaming</p>
              <button className="btn-add-account" onClick={handleOpenAdd}>
                <HiPlus />
                Add Your First Account
              </button>
            </div>
          ) : (
            <div className="accounts-list">
              {accounts.map((account) => (
                <div key={account.id} className="account-item">
                  <div className="account-header">
                    <div className="account-info">
                      <span className="account-icon">{getPlatformIcon(account.platform)}</span>
                      <div>
                        <h3 className="account-name">{account.name}</h3>
                        <p className="account-platform">{getPlatformName(account.platform)}</p>
                      </div>
                    </div>
                    <div className="account-actions">
                      {onSelectAccount && (
                        <button
                          className="btn-select-account"
                          onClick={() => handleSelect(account)}
                          title="Use this account"
                        >
                          <HiCheckCircle />
                          Use
                        </button>
                      )}
                      <button
                        className="btn-edit-account"
                        onClick={() => handleEdit(account)}
                        title="Edit account"
                      >
                        <HiPencil />
                      </button>
                      <button
                        className="btn-delete-account"
                        onClick={() => handleDelete(account.id)}
                        title="Delete account"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                  {account.description && (
                    <p className="account-description">{account.description}</p>
                  )}
                  <div className="account-details">
                    <div className="account-detail-item">
                      <HiGlobeAlt className="detail-icon" />
                      <span className="detail-label">RTMP URL:</span>
                      <span className="detail-value">{account.rtmpUrl}</span>
                    </div>
                    <div className="account-detail-item">
                      <HiShieldCheck className="detail-icon" />
                      <span className="detail-label">Stream Key:</span>
                      <span className="detail-value">
                        {account.streamKey ? '••••••••' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Account Modal */}
        {showAddModal && (
          <div className="account-form-overlay" onClick={() => setShowAddModal(false)}>
            <div className="account-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="account-form-header">
                <h3>{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
                <button className="account-form-close" onClick={() => setShowAddModal(false)}>
                  <HiXMark />
                </button>
              </div>

              <div className="account-form-body">
                <div className="form-group">
                  <label>Account Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My YouTube Channel"
                  />
                </div>

                <div className="form-group">
                  <label>Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => {
                      const platform = e.target.value;
                      setFormData({ ...formData, platform });
                      // Auto-fill RTMP URL based on platform
                      if (platform === 'youtube') {
                        setFormData(prev => ({ ...prev, platform, rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2' }));
                      } else if (platform === 'facebook') {
                        setFormData(prev => ({ ...prev, platform, rtmpUrl: 'rtmp://rtmp-api.facebook.com:80/rtmp' }));
                      } else if (platform === 'twitch') {
                        setFormData(prev => ({ ...prev, platform, rtmpUrl: 'rtmp://live.twitch.tv/app' }));
                      } else if (platform === 'instagram') {
                        setFormData(prev => ({ ...prev, platform, rtmpUrl: 'rtmp://rtmp-api.facebook.com:80/rtmp' }));
                      } else {
                        setFormData(prev => ({ ...prev, platform, rtmpUrl: '' }));
                      }
                    }}
                  >
                    <option value="">Select Platform</option>
                    <option value="youtube">YouTube Live</option>
                    <option value="facebook">Facebook Live</option>
                    <option value="twitch">Twitch</option>
                    <option value="instagram">Instagram Live</option>
                    <option value="custom">Custom RTMP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>RTMP URL *</label>
                  <input
                    type="text"
                    value={formData.rtmpUrl}
                    onChange={(e) => setFormData({ ...formData, rtmpUrl: e.target.value })}
                    placeholder="rtmp://a.rtmp.youtube.com/live2"
                  />
                </div>

                <div className="form-group">
                  <label>Stream Key</label>
                  <input
                    type="password"
                    value={formData.streamKey}
                    onChange={(e) => setFormData({ ...formData, streamKey: e.target.value })}
                    placeholder="Enter your stream key"
                  />
                  <small className="form-hint">
                    Keep your stream key private. It will be stored securely locally.
                  </small>
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description for this account"
                    rows={3}
                  />
                </div>
              </div>

              <div className="account-form-actions">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSave}>
                  {editingAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialMediaAccounts;

