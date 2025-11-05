import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiMagnifyingGlass,
  HiEnvelope,
  HiBell,
  HiCog6Tooth,
  HiCreditCard,
  HiCurrencyDollar,
  HiShieldCheck
} from 'react-icons/hi2';
import { isSuperAdmin } from '../utils/adminAuth';
import './DashboardNav.css';

function DashboardNav({ onSearch }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminBtn, setShowAdminBtn] = useState(false);
  const savedName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

  useEffect(() => {
    // Check if user is super admin
    setShowAdminBtn(isSuperAdmin());
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      }
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <nav className="dashboard-top-nav">
      <div className="top-nav-left">
        <div className="search-container">
          <HiMagnifyingGlass className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search task"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-shortcut-pill">⌘ F</span>
        </div>
      </div>

      <div className="top-nav-right">
        {showAdminBtn && (
          <button 
            className="nav-icon-btn admin-btn" 
            title="Admin Dashboard"
            onClick={() => navigate('/admin')}
            style={{ color: '#10b981' }}
          >
            <HiShieldCheck />
          </button>
        )}
        <button 
          className="nav-icon-btn" 
          title="Subscription & Billing"
          onClick={() => navigate('/subscription')}
        >
          <HiCurrencyDollar />
        </button>
        <button 
          className="nav-icon-btn" 
          title="Pricing"
          onClick={() => navigate('/pricing')}
        >
          <HiCreditCard />
        </button>
        <button className="nav-icon-btn" title="Messages">
          <HiEnvelope />
        </button>
        <button className="nav-icon-btn" title="Notifications">
          <HiBell />
        </button>
        <div className="user-profile">
          <div className="profile-avatar">
            <div className="avatar-initial">{savedName.charAt(0).toUpperCase()}</div>
          </div>
          <div className="profile-info">
            <div className="profile-name">{savedName}</div>
            <div className="profile-email">{userEmail}</div>
          </div>
        </div>
        <button className="nav-icon-btn" title="Settings">
          <HiCog6Tooth />
        </button>
      </div>
    </nav>
  );
}

export default DashboardNav;

