import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiVideoCamera } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import AdminNav from '../components/AdminNav';
import AdminSummaryCards from '../components/AdminSummaryCards';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminReminders from '../components/AdminReminders';
import AdminProjectList from '../components/AdminProjectList';
import AdminTeamCollaboration from '../components/AdminTeamCollaboration';
import AdminProjectProgress from '../components/AdminProjectProgress';
import AdminTimeTracker from '../components/AdminTimeTracker';
import AdminUsers from './AdminUsers';
import AdminPackages from './AdminPackages';
import AdminSubscriptions from './AdminSubscriptions';
import AdminPayments from './AdminPayments';
import AdminMeetings from './AdminMeetings';
import AdminActivityLogs from './AdminActivityLogs';
import AdminReports from './AdminReports';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import AdminAdvancedAnalytics from './AdminAdvancedAnalytics';
import AdminProjects from './AdminProjects';
import AdminSystemHealth from './AdminSystemHealth';
import AdminEmailTemplates from './AdminEmailTemplates';
import AdminContent from './AdminContent';
import AdminFeatureFlags from './AdminFeatureFlags';
import AdminApiKeys from './AdminApiKeys';
import AdminSupportTickets from './AdminSupportTickets';
import AdminCallCenter from './AdminCallCenter';
import AdminCustomerService from './AdminCustomerService';
import AdminCustomerExperience from './AdminCustomerExperience';
import AdminBackups from './AdminBackups';
import AdminRoles from './AdminRoles';
import AdminSettings from './AdminSettings';
import AdminHelp from './AdminHelp';
import { checkSuperAdmin, getAdminStats } from '../utils/adminAuth';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      const isAdmin = await checkSuperAdmin();
      if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
      setLoading(false);
      loadStats();
    };

    verifyAdmin();
  }, [navigate]);

  const loadStats = async () => {
    const adminStats = await getAdminStats();
    if (adminStats) {
      setStats(adminStats);
    }
  };

  const handleSearch = (query) => {
    console.log('Search:', query);
    // Implement search functionality
  };

  const handleAddProject = () => {
    setActiveItem('projects');
  };

  const handleAddMember = () => {
    toast.info('Add member functionality coming soon');
  };

  const handleStartMeeting = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName') || 'Admin';
      const response = await fetch(`${API_URL}/api/room/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId || '',
        },
        body: JSON.stringify({
          userId: userId || '',
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting room');
      }

      const data = await response.json();
      toast.success('Meeting room created successfully');
      
      const params = new URLSearchParams({ name: userName, autoStart: 'true' });
      if (data.password) {
        params.append('password', data.password);
      }
      navigate(`/room/${data.roomId}?${params.toString()}`);
    } catch (error) {
      console.error('Error creating meeting room:', error);
      toast.error(error.message || 'Failed to start meeting');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <>
            {/* Header */}
            <div className="admin-dashboard-header">
              <div>
                <h1 className="admin-dashboard-title">Dashboard</h1>
                <p className="admin-dashboard-subtitle">
                  Plan, prioritize, and accomplish your tasks with ease.
                </p>
              </div>
              <div className="admin-dashboard-actions">
                <button className="admin-action-btn admin-btn-primary" onClick={handleStartMeeting}>
                  <HiVideoCamera />
                  Start Meeting
                </button>
                <button className="admin-action-btn admin-btn-secondary" onClick={handleAddProject}>
                  <HiPlus />
                  Add Project
                </button>
                <button className="admin-action-btn admin-btn-secondary">
                  Import Data
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <AdminSummaryCards stats={stats} />

            {/* Main Grid */}
            <div className="admin-dashboard-grid">
              <div className="admin-grid-left">
                <AdminAnalytics analyticsData={stats?.analytics} />
                <AdminReminders reminders={stats?.reminders} />
              </div>

              <div className="admin-grid-right">
                <AdminProjectList 
                  projects={stats?.projects} 
                  onAddProject={handleAddProject}
                />
                <AdminTeamCollaboration 
                  teamMembers={stats?.teamMembers}
                  onAddMember={handleAddMember}
                />
                <AdminProjectProgress progressData={stats?.progress} />
                <AdminTimeTracker />
              </div>
            </div>
          </>
        );
      case 'users':
        return <AdminUsers />;
      case 'packages':
        return <AdminPackages />;
      case 'subscriptions':
        return <AdminSubscriptions />;
      case 'payments':
        return <AdminPayments />;
      case 'meetings':
        return <AdminMeetings />;
      case 'activity-logs':
        return <AdminActivityLogs />;
      case 'reports':
        return <AdminReports />;
      case 'analytics':
        return <AdminAnalyticsPage />;
      case 'advanced-analytics':
        return <AdminAdvancedAnalytics />;
      case 'projects':
        return <AdminProjects />;
      case 'system-health':
        return <AdminSystemHealth />;
      case 'email-templates':
        return <AdminEmailTemplates />;
      case 'content':
        return <AdminContent />;
      case 'feature-flags':
        return <AdminFeatureFlags />;
      case 'api-keys':
        return <AdminApiKeys />;
      case 'support-tickets':
        return <AdminSupportTickets />;
      case 'call-center':
        return <AdminCallCenter />;
      case 'customer-service':
        return <AdminCustomerService />;
      case 'customer-experience':
        return <AdminCustomerExperience />;
      case 'backups':
        return <AdminBackups />;
      case 'roles':
        return <AdminRoles />;
      case 'settings':
        return <AdminSettings />;
      case 'help':
        return <AdminHelp />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar activeItem={activeItem} onItemChange={setActiveItem} />
      <div className="admin-main-content">
        <AdminNav onSearch={handleSearch} />
        
        <div className="admin-content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

