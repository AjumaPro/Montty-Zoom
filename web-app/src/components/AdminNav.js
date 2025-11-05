import React from 'react';
import { 
  HiMagnifyingGlass, 
  HiEnvelope, 
  HiBell, 
  HiUserCircle 
} from 'react-icons/hi2';
import './AdminNav.css';

function AdminNav({ onSearch }) {
  const userName = localStorage.getItem('userName') || 'Admin';
  const userEmail = localStorage.getItem('userEmail') || 'admin@monttyzoom.com';

  return (
    <div className="admin-nav">
      <div className="admin-nav-left">
        <div className="admin-search-container">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search task"
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
          <div className="admin-search-shortcut">
            <kbd>⌘</kbd>
            <kbd>F</kbd>
          </div>
        </div>
      </div>

      <div className="admin-nav-right">
        <button className="admin-nav-icon-btn" title="Messages">
          <HiEnvelope />
        </button>
        <button className="admin-nav-icon-btn" title="Notifications">
          <HiBell />
        </button>
        <div className="admin-user-profile">
          <HiUserCircle className="admin-user-avatar" />
          <div className="admin-user-info">
            <div className="admin-user-name">{userName}</div>
            <div className="admin-user-email">{userEmail}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNav;

