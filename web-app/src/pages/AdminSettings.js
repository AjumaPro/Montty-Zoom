import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { HiCog6Tooth, HiShieldCheck, HiBell, HiGlobeAlt } from 'react-icons/hi2';
import './AdminSettings.css';

function AdminSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoBackup: true,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC'
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    toast.success('Settings saved successfully');
  };

  return (
    <div className="admin-settings-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">Manage your admin preferences</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <div className="admin-settings-sections">
        <div className="admin-settings-section">
          <div className="admin-settings-section-header">
            <HiBell className="admin-settings-icon" />
            <h2>Notifications</h2>
          </div>
          <div className="admin-settings-items">
            <div className="admin-settings-item">
              <div>
                <h3>Push Notifications</h3>
                <p>Receive push notifications for important events</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            <div className="admin-settings-item">
              <div>
                <h3>Email Alerts</h3>
                <p>Get notified via email for critical updates</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(e) => handleChange('emailAlerts', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-settings-section">
          <div className="admin-settings-section-header">
            <HiShieldCheck className="admin-settings-icon" />
            <h2>Security</h2>
          </div>
          <div className="admin-settings-items">
            <div className="admin-settings-item">
              <div>
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            <div className="admin-settings-item">
              <div>
                <h3>Auto Backup</h3>
                <p>Automatically backup data daily</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => handleChange('autoBackup', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-settings-section">
          <div className="admin-settings-section-header">
            <HiGlobeAlt className="admin-settings-icon" />
            <h2>General</h2>
          </div>
          <div className="admin-settings-items">
            <div className="admin-settings-item">
              <div>
                <h3>Language</h3>
                <p>Choose your preferred language</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="admin-settings-select"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="admin-settings-item">
              <div>
                <h3>Timezone</h3>
                <p>Set your timezone for accurate timestamps</p>
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="admin-settings-select"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">GMT</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;

