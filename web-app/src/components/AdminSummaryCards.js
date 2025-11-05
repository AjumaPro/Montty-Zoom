import React from 'react';
import { HiArrowTrendingUp } from 'react-icons/hi2';
import './AdminSummaryCards.css';

function AdminSummaryCards({ stats }) {
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.usersChange || 0,
      changeLabel: 'Increased from last month',
      color: '#10b981',
      bgColor: '#f0fdf4'
    },
    {
      title: 'Active Meetings',
      value: stats?.activeMeetings || 0,
      change: stats?.meetingsChange || 0,
      changeLabel: 'Increased from last month',
      color: '#ffffff',
      bgColor: '#ffffff'
    },
    {
      title: 'Total Subscriptions',
      value: stats?.totalSubscriptions || 0,
      change: stats?.subscriptionsChange || 0,
      changeLabel: 'Increased from last month',
      color: '#ffffff',
      bgColor: '#ffffff'
    },
    {
      title: 'Revenue',
      value: `$${stats?.revenue || 0}`,
      change: stats?.revenueChange || 0,
      changeLabel: 'Increased from last month',
      color: '#ffffff',
      bgColor: '#ffffff'
    }
  ];

  return (
    <div className="admin-summary-cards">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="admin-summary-card"
          style={{ 
            background: card.bgColor,
            borderColor: card.color === '#10b981' ? card.color : '#e5e7eb'
          }}
        >
          <div className="admin-summary-card-header">
            <h3 className="admin-summary-card-title">{card.title}</h3>
            <div className="admin-summary-card-icon" style={{ color: card.color }}>
              <HiArrowTrendingUp />
            </div>
          </div>
          <div className="admin-summary-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="admin-summary-card-change" style={{ color: '#10b981' }}>
            {card.change > 0 ? '+' : ''}{card.change} {card.changeLabel}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminSummaryCards;

