import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiArrowDownTray, 
  HiArrowPath, 
  HiChartBar,
  HiCalendar,
  HiFunnel,
  HiMagnifyingGlass,
  HiClock,
  HiCurrencyDollar,
  HiUserGroup,
  HiDocumentText,
  HiCog6Tooth,
  HiPaperClip
} from 'react-icons/hi2';
import { getRevenueReport, getUserReport, exportToCSV } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminReports.css';

function AdminReports() {
  const [revenueData, setRevenueData] = useState([]);
  const [userReport, setUserReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('revenue'); // revenue, users, combined
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    planFilter: 'all',
    statusFilter: 'all'
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const revenue = await getRevenueReport(dateRange.startDate, dateRange.endDate);
      const users = await getUserReport(dateRange.startDate, dateRange.endDate);
      setRevenueData(revenue || []);
      setUserReport(users);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
    setLoading(false);
  };

  const handleDateChange = (key, value) => {
    setDateRange({ ...dateRange, [key]: value });
  };

  const handleApplyDates = () => {
    loadReports();
  };

  const handleExportRevenue = () => {
    const exportData = revenueData.map(row => ({
      Date: new Date(row.date).toLocaleDateString(),
      Plan: row.plan_id,
      Count: row.count,
      Revenue: `$${parseFloat(row.revenue || 0).toFixed(2)}`
    }));
    exportToCSV(exportData, `revenue_report_${Date.now()}.csv`);
    toast.success('Revenue report exported successfully');
  };

  const handleExportUsers = () => {
    if (userReport) {
      const reportData = [{
        'Total Users': userReport.totalUsers,
        'New Users': userReport.newUsers,
        'Active Users': userReport.activeUsers,
        ...Object.fromEntries(
          Object.entries(userReport.subscriptionDistribution || {}).map(([key, value]) => [`${key} Plan`, value])
        )
      }];
      exportToCSV(reportData, `user_report_${Date.now()}.csv`);
      toast.success('User report exported successfully');
    }
  };

  const handleExportCombined = () => {
    const combinedData = [
      {
        'Report Type': 'Revenue Summary',
        'Total Revenue': `$${revenueData.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0).toFixed(2)}`,
        'Total Transactions': revenueData.reduce((sum, r) => sum + (r.count || 0), 0)
      },
      {
        'Report Type': 'User Summary',
        'Total Users': userReport?.totalUsers || 0,
        'New Users': userReport?.newUsers || 0,
        'Active Users': userReport?.activeUsers || 0
      }
    ];
    exportToCSV(combinedData, `combined_report_${Date.now()}.csv`);
    toast.success('Combined report exported successfully');
  };

  const calculateTotalRevenue = () => {
    return revenueData.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
  };

  const calculateRevenueByPlan = () => {
    const byPlan = {};
    revenueData.forEach(row => {
      if (!byPlan[row.plan_id]) {
        byPlan[row.plan_id] = 0;
      }
      byPlan[row.plan_id] += parseFloat(row.revenue || 0);
    });
    return byPlan;
  };

  const renderRevenueChart = () => {
    if (!revenueData || revenueData.length === 0) {
      return <div className="admin-chart-placeholder">No revenue data available</div>;
    }

    const maxRevenue = Math.max(...revenueData.map(r => parseFloat(r.revenue || 0)));
    const chartHeight = 200;

    return (
      <div className="admin-chart-container">
        <svg width="100%" height={chartHeight} className="admin-chart">
          {revenueData.map((row, index) => {
            const value = parseFloat(row.revenue || 0);
            const height = maxRevenue > 0 ? (value / maxRevenue) * chartHeight : 0;
            const x = (index / revenueData.length) * 100;
            const barWidth = 100 / revenueData.length - 2;

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
                {value > 0 && (
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={chartHeight - height - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    ${value.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="admin-chart-labels">
          {revenueData.map((row, index) => (
            <span key={index} className="admin-chart-label">
              {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const filteredRevenueData = revenueData.filter(row => {
    if (filters.planFilter !== 'all' && row.plan_id !== filters.planFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="admin-reports-loading">
        <div className="admin-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports-container">
      <div className="admin-reports-header">
        <div>
          <h1 className="admin-page-title">Reports & Analytics</h1>
          <p className="admin-page-subtitle">Generate comprehensive reports with advanced filtering and visualizations</p>
        </div>
        <div className="admin-reports-header-right">
          <button className="admin-action-btn admin-btn-secondary" onClick={loadReports}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="admin-reports-type-selector">
        <button
          className={`admin-report-type-btn ${reportType === 'revenue' ? 'active' : ''}`}
          onClick={() => setReportType('revenue')}
        >
          <HiCurrencyDollar />
          Revenue Report
        </button>
        <button
          className={`admin-report-type-btn ${reportType === 'users' ? 'active' : ''}`}
          onClick={() => setReportType('users')}
        >
          <HiUserGroup />
          User Report
        </button>
        <button
          className={`admin-report-type-btn ${reportType === 'combined' ? 'active' : ''}`}
          onClick={() => setReportType('combined')}
        >
          <HiChartBar />
          Combined Report
        </button>
      </div>

      {/* Filters */}
      <div className="admin-reports-filters">
        <div className="admin-filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>
        <div className="admin-filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </div>
        {reportType === 'revenue' && (
          <div className="admin-filter-group">
            <label>Plan Filter</label>
            <select
              value={filters.planFilter}
              onChange={(e) => setFilters({ ...filters, planFilter: e.target.value })}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
        <button className="admin-action-btn admin-btn-primary" onClick={handleApplyDates}>
          <HiFunnel />
          Apply Filters
        </button>
      </div>

      {/* Summary Cards */}
      {reportType === 'revenue' && (
        <div className="admin-reports-summary">
          <div className="admin-summary-card">
            <div className="admin-summary-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <HiCurrencyDollar />
            </div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Total Revenue</div>
              <div className="admin-summary-value">${calculateTotalRevenue().toFixed(2)}</div>
            </div>
          </div>
          <div className="admin-summary-card">
            <div className="admin-summary-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <HiDocumentText />
            </div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Total Transactions</div>
              <div className="admin-summary-value">{revenueData.reduce((sum, r) => sum + (r.count || 0), 0)}</div>
            </div>
          </div>
          <div className="admin-summary-card">
            <div className="admin-summary-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <HiCalendar />
            </div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Date Range</div>
              <div className="admin-summary-value">
                {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      <div className="admin-reports-grid">
        {reportType === 'revenue' && (
          <>
            <div className="admin-report-card admin-report-card-wide">
              <div className="admin-report-card-header">
                <h3>Revenue Trend</h3>
                <button className="admin-icon-btn" onClick={handleExportRevenue} title="Export">
                  <HiArrowDownTray />
                </button>
              </div>
              <div className="admin-report-card-content">
                {renderRevenueChart()}
              </div>
            </div>

            <div className="admin-report-card">
              <div className="admin-report-card-header">
                <h3>Revenue by Plan</h3>
              </div>
              <div className="admin-report-card-content">
                {Object.entries(calculateRevenueByPlan()).map(([plan, revenue]) => (
                  <div key={plan} className="admin-revenue-plan-item">
                    <span className="admin-plan-name">{plan}</span>
                    <span className="admin-plan-revenue">${revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-report-card admin-report-card-wide">
              <div className="admin-report-card-header">
                <h3>Detailed Revenue Data</h3>
                <button className="admin-icon-btn" onClick={handleExportRevenue} title="Export">
                  <HiArrowDownTray />
                </button>
              </div>
              <div className="admin-report-content">
                {filteredRevenueData.length === 0 ? (
                  <p className="admin-empty-text">No revenue data available</p>
                ) : (
                  <div className="admin-report-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Plan</th>
                          <th>Count</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRevenueData.slice(0, 20).map((row, idx) => (
                          <tr key={idx}>
                            <td>{new Date(row.date).toLocaleDateString()}</td>
                            <td>{row.plan_id}</td>
                            <td>{row.count}</td>
                            <td>${parseFloat(row.revenue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {reportType === 'users' && userReport && (
          <>
            <div className="admin-report-card">
              <div className="admin-report-card-header">
                <h3>User Statistics</h3>
                <button className="admin-icon-btn" onClick={handleExportUsers} title="Export">
                  <HiArrowDownTray />
                </button>
              </div>
              <div className="admin-report-content">
                <div className="admin-report-stats">
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Total Users:</span>
                    <span className="admin-stat-value">{userReport.totalUsers}</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">New Users:</span>
                    <span className="admin-stat-value">{userReport.newUsers}</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Active Users:</span>
                    <span className="admin-stat-value">{userReport.activeUsers}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-report-card">
              <div className="admin-report-card-header">
                <h3>Subscription Distribution</h3>
              </div>
              <div className="admin-report-content">
                {Object.entries(userReport.subscriptionDistribution || {}).map(([plan, count]) => (
                  <div key={plan} className="admin-subscription-item">
                    <span className="admin-plan-name">{plan}</span>
                    <span className="admin-plan-count">{count} users</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {reportType === 'combined' && (
          <div className="admin-report-card admin-report-card-wide">
            <div className="admin-report-card-header">
              <h3>Combined Report</h3>
              <button className="admin-action-btn admin-btn-primary" onClick={handleExportCombined}>
                <HiArrowDownTray />
                Export Combined
              </button>
            </div>
            <div className="admin-report-content">
              <div className="admin-combined-report">
                <div className="admin-combined-section">
                  <h4>Revenue Summary</h4>
                  <div className="admin-combined-stats">
                    <div className="admin-combined-stat">
                      <span>Total Revenue:</span>
                      <strong>${calculateTotalRevenue().toFixed(2)}</strong>
                    </div>
                    <div className="admin-combined-stat">
                      <span>Total Transactions:</span>
                      <strong>{revenueData.reduce((sum, r) => sum + (r.count || 0), 0)}</strong>
                    </div>
                  </div>
                </div>
                <div className="admin-combined-section">
                  <h4>User Summary</h4>
                  <div className="admin-combined-stats">
                    <div className="admin-combined-stat">
                      <span>Total Users:</span>
                      <strong>{userReport?.totalUsers || 0}</strong>
                    </div>
                    <div className="admin-combined-stat">
                      <span>Active Users:</span>
                      <strong>{userReport?.activeUsers || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
