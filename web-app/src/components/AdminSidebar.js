import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiSquares2X2, 
  HiClipboardDocumentList, 
  HiCalendar, 
  HiChartBar, 
  HiUserGroup,
  HiCog6Tooth,
  HiQuestionMarkCircle,
  HiArrowRightOnRectangle,
  HiDevicePhoneMobile,
  HiCube,
  HiCreditCard,
  HiClock,
  HiDocumentText,
  HiCpuChip,
  HiEnvelope,
  HiDocumentDuplicate,
  HiKey,
  HiTicket,
  HiCloudArrowDown,
  HiShieldCheck,
  HiChartBarSquare,
  HiWrenchScrewdriver,
  HiPhone,
  HiStar
} from 'react-icons/hi2';
import './AdminSidebar.css';

function AdminSidebar({ activeItem, onItemChange }) {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiSquares2X2 },
    { id: 'users', label: 'Users', icon: HiUserGroup },
    { id: 'packages', label: 'Packages', icon: HiCube },
    { id: 'subscriptions', label: 'Subscriptions', icon: HiCreditCard },
    { id: 'payments', label: 'Payments', icon: HiCreditCard },
    { id: 'meetings', label: 'Meetings', icon: HiCalendar },
    { id: 'activity-logs', label: 'Activity Logs', icon: HiClock },
    { id: 'reports', label: 'Reports', icon: HiDocumentText },
    { id: 'analytics', label: 'Analytics', icon: HiChartBar },
    { id: 'advanced-analytics', label: 'Advanced Analytics', icon: HiChartBarSquare },
    { id: 'projects', label: 'Projects', icon: HiClipboardDocumentList },
    { id: 'system-health', label: 'System Health', icon: HiCpuChip },
    { id: 'email-templates', label: 'Email Templates', icon: HiEnvelope },
    { id: 'content', label: 'Content', icon: HiDocumentDuplicate },
    { id: 'feature-flags', label: 'Feature Flags', icon: HiWrenchScrewdriver },
    { id: 'api-keys', label: 'API Keys', icon: HiKey },
    { id: 'support-tickets', label: 'Support Tickets', icon: HiTicket },
    { id: 'call-center', label: 'Call Center', icon: HiPhone },
    { id: 'customer-service', label: 'Customer Service', icon: HiPhone },
    { id: 'customer-experience', label: 'Customer Experience', icon: HiStar },
    { id: 'backups', label: 'Backups', icon: HiCloudArrowDown },
    { id: 'roles', label: 'Roles', icon: HiShieldCheck },
  ];

  const generalItems = [
    { id: 'settings', label: 'Settings', icon: HiCog6Tooth },
    { id: 'help', label: 'Help', icon: HiQuestionMarkCircle },
    { id: 'logout', label: 'Logout', icon: HiArrowRightOnRectangle }
  ];

  const handleItemClick = (itemId) => {
    if (itemId === 'logout') {
      localStorage.clear();
      navigate('/signin');
      return;
    }
    onItemChange(itemId);
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <div className="admin-logo-icon">
            <HiSquares2X2 />
          </div>
          <span className="admin-logo-text">Montty Zoom</span>
        </div>
      </div>

      <div className="admin-sidebar-content">
        <div className="admin-menu-section">
          <div className="admin-menu-heading">MENU</div>
          <nav className="admin-menu-items">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`admin-menu-item ${activeItem === item.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className="admin-menu-icon" />
                  <span className="admin-menu-label">{item.label}</span>
                  {activeItem === item.id && <div className="admin-menu-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-heading">GENERAL</div>
          <nav className="admin-menu-items">
            {generalItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`admin-menu-item ${activeItem === item.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className="admin-menu-icon" />
                  <span className="admin-menu-label">{item.label}</span>
                  {activeItem === item.id && <div className="admin-menu-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="admin-sidebar-footer">
        <div className="admin-mobile-app-card">
          <HiDevicePhoneMobile className="admin-mobile-icon" />
          <div className="admin-mobile-content">
            <h3>Download our Mobile App</h3>
            <p>Get easy in another way.</p>
            <button className="admin-mobile-btn">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;

