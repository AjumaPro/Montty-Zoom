import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiPlus, HiVideoCamera, HiArrowPath } from 'react-icons/hi2';
import MeetingScheduler from '../components/MeetingScheduler';
import JoinRoomModal from '../components/JoinRoomModal';
import StreamingPanel from '../components/StreamingPanel';
import UpgradeBanner from '../components/UpgradeBanner';
import LeftSidebar from '../components/LeftSidebar';
import DashboardNav from '../components/DashboardNav';
import SummaryCards from '../components/SummaryCards';
import MeetingAnalytics from '../components/MeetingAnalytics';
import RemindersSection from '../components/RemindersSection';
import TeamCollaboration from '../components/TeamCollaboration';
import MeetingProgress from '../components/MeetingProgress';
import MeetingList from '../components/MeetingList';
import DashboardPanel from '../components/DashboardPanel';
import TimeTracker from '../components/TimeTracker';
import RecordingControls from '../components/RecordingControls';
import Tasks from './Tasks';
import Calendar from './Calendar';
import Analytics from './Analytics';
import Team from './Team';
import Settings from './Settings';
import Help from './Help';
import Emails from './Emails';
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Home() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStreamingModal, setShowStreamingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [lastRoomInfo, setLastRoomInfo] = useState(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  // Get subscription info
  const { subscription } = useSubscriptionFeatures();

  // Show upgrade banner for free plan users
  useEffect(() => {
    if (subscription && subscription.planId === 'free') {
      setShowUpgradeBanner(true);
    } else {
      setShowUpgradeBanner(false);
    }
  }, [subscription]);

  useEffect(() => {
    // Load meetings immediately
    loadMeetings();
    
    // Set loading to false after a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // Max 3 seconds loading
    
    const interval = setInterval(loadMeetings, 60000);
    
    // Check for last room info for rejoin option
    const savedRoomInfo = localStorage.getItem('lastRoomInfo');
    if (savedRoomInfo) {
      try {
        const roomInfo = JSON.parse(savedRoomInfo);
        // Check if room info is recent (within last 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        if (roomInfo.timestamp && roomInfo.timestamp > oneDayAgo) {
          setLastRoomInfo(roomInfo);
        } else {
          localStorage.removeItem('lastRoomInfo');
        }
      } catch (error) {
        console.error('Error parsing last room info:', error);
        localStorage.removeItem('lastRoomInfo');
      }
    }
    
    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
    };
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings`);
      setMeetings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading meetings:', error);
      // Set empty array on error instead of showing error
      setMeetings([]);
      setLoading(false);
      // Only show error if it's not a network error
      if (error.response) {
        // Server responded with error status
        console.error('Server error loading meetings:', error.response.status);
      } else if (error.request) {
        // Request made but no response
        console.log('Network error loading meetings - server may be offline');
      }
    }
  };

  const handleOpenScheduler = () => {
    setEditingMeeting(null);
    setShowScheduler(true);
  };

  const handleMeetingCreated = () => {
    loadMeetings();
  };

  const handleRejoinLastRoom = () => {
    if (lastRoomInfo) {
      const params = new URLSearchParams({ name: lastRoomInfo.userName || localStorage.getItem('userName') || 'User' });
      if (lastRoomInfo.password) {
        params.append('password', lastRoomInfo.password);
      }
      window.location.href = `/room/${lastRoomInfo.roomId}?${params.toString()}`;
    }
  };

  if (loading) {
    return (
      <div className="donezo-dashboard">
        <LeftSidebar activeItem={activeMenuItem} onItemChange={setActiveMenuItem} />
        <DashboardNav onSearch={(query) => console.log('Search query:', query)} />
        <div className="dashboard-main-content">
          <div className="dashboard-container">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return (
          <>
            {showUpgradeBanner && subscription?.planId === 'free' && (
              <UpgradeBanner 
                featureName="Premium Features"
                planName="Pro"
                onDismiss={() => setShowUpgradeBanner(false)}
              />
            )}
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Plan, prioritize, and accomplish your meetings with ease.</p>
            </div>
              <div className="dashboard-actions">
                {lastRoomInfo && (
                  <button 
                    className="btn-primary" 
                    onClick={handleRejoinLastRoom}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <HiArrowPath />
                    Rejoin Last Meeting
                  </button>
                )}
                <button className="btn-primary" onClick={handleOpenScheduler}>
                  <HiPlus />
                  Add Meeting
                </button>
                <button className="btn-primary" onClick={() => setShowJoinModal(true)} style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <HiVideoCamera />
                  Join Meeting
                </button>
                <button className="btn-secondary" onClick={() => setShowStreamingModal(true)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <HiVideoCamera />
                  Stream on Social Media
                </button>
              </div>
                    </div>

            <div className="dashboard-grid">
              <div className="dashboard-left-section">
                <SummaryCards meetings={meetings} />
                
                <div className="dashboard-row">
                  <div className="dashboard-col">
                    <MeetingAnalytics meetings={meetings} />
                  </div>
                  <div className="dashboard-col">
                    <RemindersSection meetings={meetings} />
                  </div>
                </div>

                <TeamCollaboration onAddMember={() => setActiveMenuItem('team')} />
                </div>

              <div className="dashboard-right-section">
                <RecordingControls />
                <MeetingProgress meetings={meetings} />
                <MeetingList meetings={meetings} onAddMeeting={handleOpenScheduler} />
                <TimeTracker />
                <DashboardPanel />
              </div>
            </div>
          </>
        );
      case 'tasks':
        return <Tasks />;
      case 'calendar':
        return <Calendar />;
      case 'analytics':
        return <Analytics />;
      case 'team':
        return <Team />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      case 'emails':
        return <Emails />;
      default:
        return null;
    }
  };

  return (
    <div className="donezo-dashboard">
      <LeftSidebar activeItem={activeMenuItem} onItemChange={setActiveMenuItem} />
      <DashboardNav onSearch={(query) => {
        // Handle search - could filter meetings or navigate to search results
        console.log('Search query:', query);
      }} />
      
      <div className="dashboard-main-content">
        {renderContent()}
      </div>

      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => {
          setShowScheduler(false);
          setEditingMeeting(null);
        }}
        onMeetingCreated={handleMeetingCreated}
        meeting={editingMeeting}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />

      <StreamingPanel
        isOpen={showStreamingModal}
        onClose={() => setShowStreamingModal(false)}
        roomId={null}
        userId={localStorage.getItem('userId') || `user-${Date.now()}`}
        isHost={true}
        onCreateMeeting={handleOpenScheduler}
        onJoinMeeting={() => setShowJoinModal(true)}
      />
    </div>
  );
}

export default Home;
