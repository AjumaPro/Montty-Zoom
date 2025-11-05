import React, { useState, useEffect } from 'react';
import { getAnalytics, getAllSubscriptions } from '../utils/adminAuth';
import './AdminAnalyticsPage.css';

function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [analyticsData, subscriptionsData] = await Promise.all([
      getAnalytics(),
      getAllSubscriptions()
    ]);
    setAnalytics(analyticsData);
    setSubscriptions(subscriptionsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="admin-analytics-loading">
        <div className="admin-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const maxDailyMeetings = analytics?.dailyMeetings ? Math.max(...analytics.dailyMeetings, 1) : 1;

  return (
    <div className="admin-analytics-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-subtitle">Platform insights and metrics</p>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-analytics-card">
          <h3>Daily Meetings (Last 7 Days)</h3>
          <div className="admin-chart-container">
            <div className="admin-bar-chart">
              {analytics?.dailyMeetings?.map((count, index) => {
                const height = (count / maxDailyMeetings) * 100;
                const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                return (
                  <div key={index} className="admin-bar-wrapper">
                    <div className="admin-bar" style={{ height: `${height}%` }}>
                      <span className="admin-bar-value">{count}</span>
                    </div>
                    <span className="admin-bar-label">{days[index]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-analytics-card">
          <h3>Subscription Distribution</h3>
          <div className="admin-pie-chart">
            {analytics?.subscriptionDistribution && Object.entries(analytics.subscriptionDistribution).map(([plan, count]) => (
              <div key={plan} className="admin-pie-item">
                <div className="admin-pie-color" style={{ backgroundColor: getPlanColor(plan) }}></div>
                <span className="admin-pie-label">{plan.toUpperCase()}: {count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-analytics-card">
          <h3>Platform Statistics</h3>
          <div className="admin-stats-grid">
            <div className="admin-stat-item">
              <span className="admin-stat-label">Active Users (30 days)</span>
              <span className="admin-stat-value">{analytics?.activeUsers || 0}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-label">Total Meetings</span>
              <span className="admin-stat-value">{analytics?.totalMeetings || 0}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-label">Total Rooms</span>
              <span className="admin-stat-value">{analytics?.totalRooms || 0}</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-label">Total Duration</span>
              <span className="admin-stat-value">{formatDuration(analytics?.totalDuration || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPlanColor(plan) {
  const colors = {
    free: '#9ca3af',
    basic: '#3b82f6',
    pro: '#10b981',
    yearly: '#8b5cf6'
  };
  return colors[plan] || '#9ca3af';
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default AdminAnalyticsPage;

