import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiArrowPath, 
  HiChartBar, 
  HiArrowTrendingUp, 
  HiArrowTrendingDown,
  HiCurrencyDollar,
  HiUserGroup,
  HiClock,
  HiFunnel,
  HiArrowDownTray,
  HiCalendar
} from 'react-icons/hi2';
import { getAdvancedAnalytics } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminAdvancedAnalytics.css';

function AdminAdvancedAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparison

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await getAdvancedAnalytics();
    
    // Enhance data with calculated metrics
    if (data) {
      // Calculate growth rates
      const enhancedData = {
        ...data,
        revenue: {
          ...data.revenue,
          growthRate: calculateGrowthRate(data.revenue?.daily || []),
          avgDaily: calculateAverage(data.revenue?.daily || [], 'revenue'),
          peakDay: findPeakDay(data.revenue?.daily || [], 'revenue')
        },
        users: {
          ...data.users,
          growthRate: calculateUserGrowth(data.users),
          avgDailyActive: calculateAverage(data.users?.daily || [], 'active'),
          conversionRate: calculateConversionRate(data.users, data.conversions)
        },
        conversions: {
          ...data.conversions,
          conversionRate: calculateConversionRate(data.users, data.conversions),
          trend: calculateTrend(data.conversions)
        }
      };
      setAnalytics(enhancedData);
    }
    setLoading(false);
  };

  const calculateGrowthRate = (dailyData) => {
    if (!dailyData || dailyData.length < 2) return 0;
    const first = dailyData[0]?.revenue || 0;
    const last = dailyData[dailyData.length - 1]?.revenue || 0;
    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first * 100).toFixed(1);
  };

  const calculateAverage = (data, field) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return (sum / data.length).toFixed(2);
  };

  const findPeakDay = (data, field) => {
    if (!data || data.length === 0) return null;
    return data.reduce((peak, item) => 
      (item[field] || 0) > (peak[field] || 0) ? item : peak
    );
  };

  const calculateUserGrowth = (users) => {
    if (!users || !users.daily || users.daily.length < 2) return 0;
    const first = users.daily[0]?.new || 0;
    const last = users.daily[users.daily.length - 1]?.new || 0;
    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first * 100).toFixed(1);
  };

  const calculateConversionRate = (users, conversions) => {
    if (!users || !conversions) return 0;
    const totalUsers = users.total || 0;
    const paidUsers = conversions.freeToPaid + conversions.trialToPaid || 0;
    if (totalUsers === 0) return 0;
    return ((paidUsers / totalUsers) * 100).toFixed(2);
  };

  const calculateTrend = (conversions) => {
    // Simple trend calculation
    return conversions.freeToPaid > conversions.trialToPaid ? 'up' : 'down';
  };

  const renderChart = (data, type = 'bar') => {
    if (!data || data.length === 0) {
      return <div className="admin-chart-placeholder">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d.revenue || d.active || d.new || 0));
    const chartHeight = 200;

    return (
      <div className="admin-chart-container">
        <svg width="100%" height={chartHeight} className="admin-chart">
          {data.map((item, index) => {
            const value = item.revenue || item.active || item.new || 0;
            const height = (value / maxValue) * chartHeight;
            const x = (index / data.length) * 100;
            const barWidth = 100 / data.length - 2;

            return (
              <g key={index}>
                <rect
                  x={`${x}%`}
                  y={chartHeight - height}
                  width={`${barWidth}%`}
                  height={height}
                  fill="#2563eb"
                  rx={4}
                  className="admin-chart-bar"
                />
                <text
                  x={`${x + barWidth / 2}%`}
                  y={chartHeight - height - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {value > 0 ? (item.revenue ? `$${value.toFixed(0)}` : value) : ''}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="admin-chart-labels">
          {data.map((item, index) => (
            <span key={index} className="admin-chart-label">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analytics.revenue?.total?.toFixed(2) || '0.00'}`],
      ['Revenue Growth Rate', `${analytics.revenue?.growthRate || 0}%`],
      ['User Retention Rate', `${analytics.users?.retention || 0}%`],
      ['User Churn Rate', `${analytics.users?.churn || 0}%`],
      ['Conversion Rate', `${analytics.conversions?.conversionRate || 0}%`],
      ['Free to Paid', analytics.conversions?.freeToPaid || 0],
      ['Trial to Paid', analytics.conversions?.trialToPaid || 0],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advanced_analytics_${Date.now()}.csv`;
    a.click();
    toast.success('Analytics exported successfully');
  };

  if (loading) {
    return (
      <div className="admin-advanced-analytics-loading">
        <div className="admin-spinner"></div>
        <p>Loading advanced analytics...</p>
      </div>
    );
  }

  return (
    <div className="admin-advanced-analytics-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Advanced Analytics</h1>
          <p className="admin-page-subtitle">Deep insights into revenue, user growth, and conversion metrics</p>
        </div>
        <div className="admin-advanced-analytics-actions">
          <select 
            className="admin-select-medium"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select 
            className="admin-select-medium"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed</option>
            <option value="comparison">Comparison</option>
          </select>
          <button className="admin-action-btn admin-btn-secondary" onClick={exportAnalytics}>
            <HiArrowDownTray />
            Export
          </button>
          <button className="admin-action-btn admin-btn-primary" onClick={loadAnalytics}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="admin-analytics-metrics-grid">
        <div className="admin-analytics-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-label">Total Revenue</span>
            <span className={`admin-metric-change ${analytics?.revenue?.growthRate >= 0 ? 'positive' : 'negative'}`}>
              {analytics?.revenue?.growthRate >= 0 ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
              {analytics?.revenue?.growthRate || 0}%
            </span>
          </div>
          <div className="admin-metric-value">
            ${analytics?.revenue?.total?.toFixed(2) || '0.00'}
          </div>
          <div className="admin-metric-subtext">
            Avg Daily: ${analytics?.revenue?.avgDaily || '0.00'}
          </div>
        </div>

        <div className="admin-analytics-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-label">User Retention</span>
            <span className={`admin-metric-change ${analytics?.users?.retention >= 70 ? 'positive' : 'negative'}`}>
              {analytics?.users?.retention >= 70 ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
              {analytics?.users?.retention || 0}%
            </span>
          </div>
          <div className="admin-metric-value">
            {analytics?.users?.retention || 0}%
          </div>
          <div className="admin-metric-subtext">
            Churn Rate: {analytics?.users?.churn || 0}%
          </div>
        </div>

        <div className="admin-analytics-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-label">Conversion Rate</span>
            <span className={`admin-metric-change ${analytics?.conversions?.conversionRate >= 5 ? 'positive' : 'negative'}`}>
              {analytics?.conversions?.conversionRate >= 5 ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
              {analytics?.conversions?.conversionRate || 0}%
            </span>
          </div>
          <div className="admin-metric-value">
            {analytics?.conversions?.conversionRate || 0}%
          </div>
          <div className="admin-metric-subtext">
            Free→Paid: {analytics?.conversions?.freeToPaid || 0} | Trial→Paid: {analytics?.conversions?.trialToPaid || 0}
          </div>
        </div>

        <div className="admin-analytics-metric-card">
          <div className="admin-metric-header">
            <span className="admin-metric-label">Avg Daily Active Users</span>
            <span className="admin-metric-change positive">
              <HiArrowTrendingUp />
              {analytics?.users?.growthRate || 0}%
            </span>
          </div>
          <div className="admin-metric-value">
            {analytics?.users?.avgDailyActive || 0}
          </div>
          <div className="admin-metric-subtext">
            Peak: {analytics?.users?.peakDay?.active || 0}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="admin-analytics-charts-grid">
        <div className="admin-analytics-chart-card">
          <div className="admin-chart-card-header">
            <h3>Revenue Trend</h3>
            <select 
              className="admin-select-small"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="revenue">Revenue</option>
              <option value="users">Users</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
          <div className="admin-chart-card-content">
            {renderChart(analytics?.revenue?.daily || [])}
          </div>
        </div>

        <div className="admin-analytics-chart-card">
          <div className="admin-chart-card-header">
            <h3>User Growth</h3>
          </div>
          <div className="admin-chart-card-content">
            {renderChart(analytics?.users?.daily || [])}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {viewMode === 'detailed' && (
        <div className="admin-analytics-details-grid">
          <div className="admin-analytics-detail-card">
            <h3>Revenue Breakdown</h3>
            <div className="admin-detail-list">
              <div className="admin-detail-item">
                <span>Total Revenue:</span>
                <span className="admin-detail-value">${analytics?.revenue?.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="admin-detail-item">
                <span>Average Daily:</span>
                <span className="admin-detail-value">${analytics?.revenue?.avgDaily || '0.00'}</span>
              </div>
              <div className="admin-detail-item">
                <span>Peak Day:</span>
                <span className="admin-detail-value">
                  {analytics?.revenue?.peakDay?.date 
                    ? new Date(analytics.revenue.peakDay.date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="admin-detail-item">
                <span>Peak Revenue:</span>
                <span className="admin-detail-value">${analytics?.revenue?.peakDay?.revenue?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="admin-analytics-detail-card">
            <h3>User Metrics</h3>
            <div className="admin-detail-list">
              <div className="admin-detail-item">
                <span>Retention Rate:</span>
                <span className="admin-detail-value">{analytics?.users?.retention || 0}%</span>
              </div>
              <div className="admin-detail-item">
                <span>Churn Rate:</span>
                <span className="admin-detail-value">{analytics?.users?.churn || 0}%</span>
              </div>
              <div className="admin-detail-item">
                <span>Avg Daily Active:</span>
                <span className="admin-detail-value">{analytics?.users?.avgDailyActive || 0}</span>
              </div>
              <div className="admin-detail-item">
                <span>Growth Rate:</span>
                <span className="admin-detail-value">{analytics?.users?.growthRate || 0}%</span>
              </div>
            </div>
          </div>

          <div className="admin-analytics-detail-card">
            <h3>Conversion Metrics</h3>
            <div className="admin-detail-list">
              <div className="admin-detail-item">
                <span>Conversion Rate:</span>
                <span className="admin-detail-value">{analytics?.conversions?.conversionRate || 0}%</span>
              </div>
              <div className="admin-detail-item">
                <span>Free to Paid:</span>
                <span className="admin-detail-value">{analytics?.conversions?.freeToPaid || 0}</span>
              </div>
              <div className="admin-detail-item">
                <span>Trial to Paid:</span>
                <span className="admin-detail-value">{analytics?.conversions?.trialToPaid || 0}</span>
              </div>
              <div className="admin-detail-item">
                <span>Trend:</span>
                <span className={`admin-detail-value admin-trend-${analytics?.conversions?.trend || 'neutral'}`}>
                  {analytics?.conversions?.trend === 'up' ? '📈 Up' : analytics?.conversions?.trend === 'down' ? '📉 Down' : '➡️ Stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analytics && (
        <div className="admin-empty-state">
          <HiChartBar className="admin-empty-icon" />
          <p>No analytics data available</p>
          <p className="admin-empty-subtext">Analytics will appear here once you have sufficient data</p>
        </div>
      )}
    </div>
  );
}

export default AdminAdvancedAnalytics;
