import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiHome,
  HiCheckBadge,
  HiCalendar,
  HiChartBar,
  HiUserGroup,
  HiCog6Tooth,
  HiQuestionMarkCircle,
  HiArrowRightOnRectangle,
  HiDevicePhoneMobile,
  HiEnvelope,
  HiCurrencyDollar,
  HiShieldCheck
} from 'react-icons/hi2';
import { isSuperAdmin } from '../utils/adminAuth';
import './LeftSidebar.css';

function LeftSidebar({ activeItem, onItemChange }) {
  const navigate = useNavigate();
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    // Check if user is super admin
    setShowAdminLink(isSuperAdmin());
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiHome },
    { id: 'tasks', label: 'Tasks', icon: HiCheckBadge, badge: '12+' },
    { id: 'calendar', label: 'Calendar', icon: HiCalendar },
    { id: 'analytics', label: 'Analytics', icon: HiChartBar },
    { id: 'team', label: 'Team', icon: HiUserGroup },
    { id: 'emails', label: 'Emails', icon: HiEnvelope }
  ];

  const generalItems = [
    { id: 'subscription', label: 'Subscription', icon: HiCurrencyDollar, route: '/subscription' },
    { id: 'settings', label: 'Settings', icon: HiCog6Tooth },
    { id: 'help', label: 'Help', icon: HiQuestionMarkCircle },
    { id: 'logout', label: 'Logout', icon: HiArrowRightOnRectangle }
  ];

  const handleItemClick = (itemId) => {
    if (itemId === 'logout') {
      // Handle logout
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      window.location.href = '/signin';
      return;
    } else if (itemId === 'subscription') {
      navigate('/subscription');
      return;
    } else if (itemId === 'admin') {
      navigate('/admin');
      return;
    } else {
      onItemChange(itemId);
    }
  };

  return (
    <div className="left-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">M</div>
          <span className="logo-text">Montty Zoom</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Menu</div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                {isActive && <div className="nav-indicator"></div>}
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">General</div>
          {generalItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
          {showAdminLink && (
            <button
              className="nav-item admin-link"
              onClick={() => handleItemClick('admin')}
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            >
              <HiShieldCheck className="nav-icon" />
              <span className="nav-label">Admin Dashboard</span>
            </button>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="mobile-app-card">
          <div className="mobile-app-content">
            <h3>Download our Mobile App</h3>
            <p>Get easy in another way</p>
          </div>
          <div className="mobile-app-icon">
            <HiDevicePhoneMobile />
          </div>
          <button className="mobile-app-btn">Download</button>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;

