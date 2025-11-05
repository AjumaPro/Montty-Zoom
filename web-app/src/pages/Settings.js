import React, { useState, useEffect } from 'react';
import { HiUser, HiBell, HiLockClosed, HiGlobe, HiDevicePhoneMobile, HiCalendar, HiVideoCamera } from 'react-icons/hi2';
import CalendarSettings from '../components/CalendarSettings';
import SocialMediaAccounts from '../components/SocialMediaAccounts';
import { toast } from 'react-toastify';
import './Settings.css';

function Settings() {
  const savedName = localStorage.getItem('userName') || '';
  const savedEmail = localStorage.getItem('userEmail') || '';
  
  const [profile, setProfile] = useState({
    name: savedName,
    email: savedEmail,
    phone: ''
  });

  useEffect(() => {
    // Check for calendar connection success/error in URL params
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get('calendar');
    if (calendarStatus === 'connected') {
      toast.success('Calendar connected successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    } else if (calendarStatus === 'error') {
      toast.error('Failed to connect calendar. Please try again.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    meetings: true
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30
  });
  const [showSocialAccounts, setShowSocialAccounts] = useState(false);

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    if (field === 'name') {
      localStorage.setItem('userName', value);
    }
    if (field === 'email') {
      localStorage.setItem('userEmail', value);
    }
  };

  const handleNotificationChange = (field, value) => {
    setNotifications({ ...notifications, [field]: value });
  };

  const handleSecurityChange = (field, value) => {
    setSecurity({ ...security, [field]: value });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <div className="section-header">
            <HiUser className="section-icon" />
            <h2 className="section-title">Profile</h2>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                placeholder="Enter your phone"
              />
            </div>
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <HiBell className="section-icon" />
            <h2 className="section-title">Notifications</h2>
          </div>
          <div className="section-content">
            <div className="setting-item">
              <div>
                <label className="setting-label">Email Notifications</label>
                <p className="setting-description">Receive email updates about meetings</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div>
                <label className="setting-label">Push Notifications</label>
                <p className="setting-description">Receive push notifications on your device</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => handleNotificationChange('push', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div>
                <label className="setting-label">Meeting Reminders</label>
                <p className="setting-description">Get reminders before meetings start</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.reminders}
                  onChange={(e) => handleNotificationChange('reminders', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div>
                <label className="setting-label">Meeting Updates</label>
                <p className="setting-description">Notifications about meeting changes</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.meetings}
                  onChange={(e) => handleNotificationChange('meetings', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <HiLockClosed className="section-icon" />
            <h2 className="section-title">Security</h2>
          </div>
          <div className="section-content">
            <div className="setting-item">
              <div>
                <label className="setting-label">Two-Factor Authentication</label>
                <p className="setting-description">Add an extra layer of security to your account</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={security.twoFactor}
                  onChange={(e) => handleSecurityChange('twoFactor', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={security.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="120"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <HiCalendar className="section-icon" />
            <h2 className="section-title">Calendar Integration</h2>
          </div>
          <div className="section-content">
            <CalendarSettings />
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <HiVideoCamera className="section-icon" />
            <h2 className="section-title">Social Media Accounts</h2>
          </div>
          <div className="section-content">
            <div className="setting-item">
              <div>
                <label className="setting-label">Manage Streaming Accounts</label>
                <p className="setting-description">Add and manage your social media accounts for live streaming</p>
              </div>
              <button className="btn-primary" onClick={() => setShowSocialAccounts(true)}>
                Manage Accounts
              </button>
            </div>
          </div>
        </div>
      </div>

      <SocialMediaAccounts
        isOpen={showSocialAccounts}
        onClose={() => setShowSocialAccounts(false)}
      />
    </div>
  );
}

export default Settings;

