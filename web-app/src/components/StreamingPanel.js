import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  HiVideoCamera,
  HiXMark,
  HiPlay,
  HiStop,
  HiQuestionMarkCircle,
  HiGlobeAlt,
  HiCheckCircle,
  HiCog6Tooth,
  HiPlus,
  HiArrowRightOnRectangle,
  HiLanguage,
  HiFire
} from 'react-icons/hi2';
import SocialMediaAccounts from './SocialMediaAccounts';
import './StreamingPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function StreamingPanel({ isOpen, onClose, roomId, userId, isHost, onCreateMeeting, onJoinMeeting, onEnableCaptions, audioStream }) {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [recordWhileStreaming, setRecordWhileStreaming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedPlatform === 'youtube' && platforms.length > 0) {
      const youtubePlatform = platforms.find(p => p.id === 'youtube');
      if (youtubePlatform && youtubePlatform.defaultStreamKey && !streamKey) {
        setStreamKey(youtubePlatform.defaultStreamKey);
      }
    }
  }, [selectedPlatform, platforms]);

  useEffect(() => {
    if (isOpen) {
      loadPlatforms();
      loadSavedAccounts();
      if (roomId) {
        checkStreamStatus();
      }
    }
  }, [isOpen, roomId]);

  useEffect(() => {
    if (selectedPlatform) {
      const platform = platforms.find(p => p.id === selectedPlatform);
      if (platform) {
        setRtmpUrl(platform.rtmpUrl);
        setInstructions(platform.instructions);
      } else {
        setRtmpUrl('');
        setInstructions('');
      }
    }
  }, [selectedPlatform, platforms]);

  const loadPlatforms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/streaming/platforms`);
      setPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Error loading platforms:', error);
      toast.error('Failed to load streaming platforms');
    }
  };

  const loadSavedAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem('socialMediaAccounts') || '[]');
      setSavedAccounts(accounts);
    } catch (error) {
      console.error('Error loading saved accounts:', error);
      setSavedAccounts([]);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setRtmpUrl(account.rtmpUrl);
    setStreamKey(account.streamKey);
    setSelectedPlatform(account.platform || 'custom');
    toast.success(`Loaded account: ${account.name}`);
  };

  const handleCreateMeeting = async () => {
    const userName = localStorage.getItem('userName') || 'User';
    if (!userName.trim()) {
      toast.error('Please enter your name in settings');
      return;
    }

    if (onCreateMeeting) {
      onCreateMeeting();
      onClose();
      return;
    }

    // Default implementation
    try {
      toast.info('Creating meeting...');
      const response = await axios.post(`${API_URL}/api/room/create`);
      const room = response.data;
      const params = new URLSearchParams({ name: userName, autoStart: 'true' });
      if (room.password) {
        params.append('password', room.password);
      }
      navigate(`/room/${room.roomId}?${params.toString()}`);
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  const handleJoinMeeting = () => {
    if (onJoinMeeting) {
      onJoinMeeting();
      onClose();
    } else {
      // Default: navigate to home where join modal can be opened
      navigate('/');
      onClose();
      // Could also trigger join modal programmatically
      setTimeout(() => {
        const joinButton = document.querySelector('[data-join-meeting]');
        if (joinButton) joinButton.click();
      }, 100);
    }
  };

  const handleStartYouTubeLive = async () => {
    const userName = localStorage.getItem('userName') || 'User';
    
    // Ensure platforms are loaded
    if (platforms.length === 0) {
      await loadPlatforms();
    }
    
    const youtubePlatform = platforms.find(p => p.id === 'youtube');
    const rtmpUrl = youtubePlatform?.rtmpUrl || 'rtmp://a.rtmp.youtube.com/live2';
    const streamKey = youtubePlatform?.defaultStreamKey || '';
    
    if (!streamKey) {
      toast.error('YouTube stream key not configured. Please add it in Settings > Social Media Accounts or check your .env file.');
      return;
    }
    
    // If no room, create one first
    if (!roomId) {
      if (!userName.trim()) {
        toast.error('Please enter your name in settings');
        return;
      }

      try {
        setIsLoading(true);
        toast.info('Creating meeting and starting YouTube Live...');
        const response = await axios.post(`${API_URL}/api/room/create`);
        const room = response.data;
        const params = new URLSearchParams({ name: userName, autoStart: 'true' });
        if (room.password) {
          params.append('password', room.password);
        }
        
        // Navigate to room first
        navigate(`/room/${room.roomId}?${params.toString()}`);
        
        // Wait for room to be ready, then start streaming
        setTimeout(async () => {
          try {
            const platformName = youtubePlatform?.name || 'YouTube Live';
            
            await axios.post(`${API_URL}/api/streaming/start`, {
              roomId: room.roomId,
              userId: userId || `user-${Date.now()}`,
              rtmpUrl: rtmpUrl.trim(),
              streamKey: streamKey.trim(),
              platform: platformName,
              recordWhileStreaming: false
            });

            toast.success(`YouTube Live streaming started!`);
          } catch (error) {
            console.error('Error starting YouTube Live:', error);
            toast.error(error.response?.data?.error || 'Failed to start YouTube Live streaming');
          }
        }, 2000); // Wait 2 seconds for room to initialize
        
        onClose();
      } catch (error) {
        console.error('Error creating meeting:', error);
        toast.error('Failed to create meeting');
        setIsLoading(false);
      }
    } else {
      // Already in a meeting, start streaming
      try {
        setIsLoading(true);
        const platformName = youtubePlatform?.name || 'YouTube Live';
        
        const response = await axios.post(`${API_URL}/api/streaming/start`, {
          roomId,
          userId,
          rtmpUrl: rtmpUrl.trim(),
          streamKey: streamKey.trim(),
          platform: platformName,
          recordWhileStreaming: false
        });

        toast.success(`YouTube Live streaming started!`);
        setIsStreaming(true);
        setCurrentPlatform(platformName);
        onClose();
      } catch (error) {
        console.error('Error starting YouTube Live:', error);
        toast.error(error.response?.data?.error || 'Failed to start YouTube Live streaming');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const checkStreamStatus = async () => {
    if (!roomId) return;
    try {
      const response = await axios.get(`${API_URL}/api/streaming/status/${roomId}`);
      setIsStreaming(response.data.isStreaming || false);
      if (response.data.platform) {
        setCurrentPlatform(response.data.platform);
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
    }
  };

  const handleStartStreaming = async () => {
    if (!selectedPlatform && !rtmpUrl.trim()) {
      toast.error('Please select a platform or enter RTMP URL');
      return;
    }

    if (!rtmpUrl.trim()) {
      toast.error('Please enter RTMP URL');
      return;
    }

    if (selectedPlatform !== 'custom' && !streamKey.trim()) {
      toast.error('Please enter stream key');
      return;
    }

    if (!roomId) {
      toast.error('No active meeting room. Please join or create a meeting first.');
      return;
    }

    setIsLoading(true);
    try {
      // Use account name if account is selected, otherwise use platform name
      const platformName = selectedAccount 
        ? selectedAccount.name 
        : (platforms.find(p => p.id === selectedPlatform)?.name || selectedPlatform || 'Custom RTMP');

      const response = await axios.post(`${API_URL}/api/streaming/start`, {
        roomId,
        userId,
        rtmpUrl: rtmpUrl.trim(),
        streamKey: streamKey.trim(),
        platform: platformName,
        recordWhileStreaming: recordWhileStreaming
      });

      toast.success(`Streaming started to ${platformName}!`);
      setIsStreaming(true);
      setCurrentPlatform(platformName);
      onClose();
    } catch (error) {
      console.error('Error starting stream:', error);
      const errorMessage = error.response?.data?.error || 'Failed to start streaming';
      
      // Handle multi-line error messages (like FFmpeg installation instructions)
      if (errorMessage.includes('\n')) {
        // Show first line in toast, full message in console
        const firstLine = errorMessage.split('\n')[0];
        toast.error(firstLine);
        console.error('Full error details:', errorMessage);
        // You could also show a modal with full error details here
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopStreaming = async () => {
    if (!roomId) {
      toast.error('No active meeting room');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/streaming/stop`, {
        roomId,
        userId
      });

      toast.success('Streaming stopped');
      setIsStreaming(false);
      setCurrentPlatform(null);
      onClose();
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error(error.response?.data?.error || 'Failed to stop streaming');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!isHost) {
    return (
      <div className="streaming-panel-overlay" onClick={onClose}>
        <div className="streaming-panel" onClick={(e) => e.stopPropagation()}>
          <div className="streaming-panel-header">
            <h2>Live Streaming</h2>
            <button className="streaming-panel-close" onClick={onClose}>
              <HiXMark />
            </button>
          </div>
          <div className="streaming-panel-content">
            <div className="streaming-info-message">
              <HiVideoCamera className="info-icon" />
              <p>Only the host can start and stop live streaming.</p>
              {isStreaming && (
                <div className="streaming-status-active">
                  <HiCheckCircle />
                  <span>Currently streaming to {currentPlatform || 'platform'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show info message if no room is active
  if (!roomId) {
    return (
      <div className="streaming-panel-overlay" onClick={onClose}>
        <div className="streaming-panel" onClick={(e) => e.stopPropagation()}>
          <div className="streaming-panel-header">
            <h2>Live Streaming</h2>
            <button className="streaming-panel-close" onClick={onClose}>
              <HiXMark />
            </button>
          </div>
          <div className="streaming-panel-content">
            <div className="streaming-info-message">
              <HiVideoCamera className="info-icon" />
              <p>To start streaming, please join or create a meeting first.</p>
              <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                Once you're in a meeting, you can stream it to YouTube, Facebook, Twitch, or any custom RTMP server.
              </p>
            </div>
            <div className="streaming-panel-actions">
              <button className="btn-youtube-live" onClick={handleStartYouTubeLive} disabled={isLoading}>
                <HiFire />
                Start YouTube Live
              </button>
              <button className="btn-create-meeting" onClick={handleCreateMeeting}>
                <HiPlus />
                Create Meeting
              </button>
              <button className="btn-join-meeting" onClick={handleJoinMeeting}>
                <HiArrowRightOnRectangle />
                Join Meeting
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="streaming-panel-overlay" onClick={onClose}>
      <div className="streaming-panel" onClick={(e) => e.stopPropagation()}>
        <div className="streaming-panel-header">
          <h2>Live Streaming</h2>
          <button className="streaming-panel-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="streaming-panel-content">
          {isStreaming ? (
            <div className="streaming-active-view">
              <div className="streaming-status-active">
                <HiCheckCircle className="status-icon" />
                <div>
                  <h3>Streaming Active</h3>
                  <p>Currently streaming to {currentPlatform || 'platform'}</p>
                </div>
              </div>
              <button
                className="btn-stop-streaming"
                onClick={handleStopStreaming}
                disabled={isLoading}
              >
                <HiStop />
                {isLoading ? 'Stopping...' : 'Stop Streaming'}
              </button>
            </div>
          ) : (
            <>
              <div className="streaming-accounts-section">
                <div className="accounts-header">
                  <label>Saved Accounts</label>
                  <button
                    className="btn-manage-accounts"
                    onClick={() => setShowAccountsModal(true)}
                    title="Manage accounts"
                  >
                    <HiCog6Tooth />
                    Manage
                  </button>
                </div>
                {savedAccounts.length > 0 ? (
                  <select
                    value={selectedAccount?.id || ''}
                    onChange={(e) => {
                      const accountId = e.target.value;
                      const account = savedAccounts.find(acc => acc.id === accountId);
                      if (account) {
                        handleAccountSelect(account);
                      } else {
                        setSelectedAccount(null);
                        setRtmpUrl('');
                        setStreamKey('');
                        setSelectedPlatform('');
                      }
                    }}
                    className="account-select"
                  >
                    <option value="">-- Select Saved Account --</option>
                    {savedAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.platform || 'custom'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="no-accounts-hint">
                    <p>No saved accounts. <button onClick={() => setShowAccountsModal(true)} className="link-button">Add one</button> to quickly start streaming.</p>
                  </div>
                )}
              </div>

              <div className="streaming-divider">
                <span>OR</span>
              </div>

              <div className="streaming-platforms">
                <label>Select Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => {
                    setSelectedPlatform(e.target.value);
                    setSelectedAccount(null); // Clear selected account when manually selecting platform
                  }}
                  className="platform-select"
                >
                  <option value="">-- Select Platform --</option>
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlatform && (
                <div className="streaming-instructions">
                  <HiQuestionMarkCircle className="info-icon" />
                  <p>{instructions}</p>
                </div>
              )}

              <div className="streaming-form">
                <div className="form-group">
                  <label>
                    <HiGlobeAlt className="label-icon" />
                    RTMP URL
                  </label>
                  <input
                    type="text"
                    value={rtmpUrl}
                    onChange={(e) => setRtmpUrl(e.target.value)}
                    placeholder="rtmp://a.rtmp.youtube.com/live2"
                    disabled={selectedPlatform && selectedPlatform !== 'custom'}
                  />
                </div>

                {selectedPlatform !== 'custom' && selectedPlatform && (
                  <div className="form-group">
                    <label>
                      <HiVideoCamera className="label-icon" />
                      Stream Key
                    </label>
                    <input
                      type="password"
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      placeholder="Enter your stream key"
                    />
                    <small className="form-hint">
                      Keep your stream key private. Never share it publicly.
                    </small>
                  </div>
                )}

                {selectedPlatform === 'custom' && (
                  <div className="form-group">
                    <label>
                      <HiVideoCamera className="label-icon" />
                      Stream Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      placeholder="Enter stream key if required"
                    />
                  </div>
                )}

                <div className="streaming-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={recordWhileStreaming}
                      onChange={(e) => setRecordWhileStreaming(e.target.checked)}
                    />
                    <span>Record video while streaming</span>
                  </label>
                  {onEnableCaptions && (
                    <button
                      className="btn-captions"
                      onClick={() => {
                        onEnableCaptions();
                        onClose();
                      }}
                      type="button"
                    >
                      <HiLanguage />
                      Enable Live Captions
                    </button>
                  )}
                </div>
              </div>

              <div className="streaming-panel-actions">
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-start-streaming"
                  onClick={handleStartStreaming}
                  disabled={isLoading || !rtmpUrl.trim()}
                >
                  <HiPlay />
                  {isLoading ? 'Starting...' : 'Start Streaming'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SocialMediaAccounts
        isOpen={showAccountsModal}
        onClose={() => {
          setShowAccountsModal(false);
          loadSavedAccounts(); // Reload accounts after closing
        }}
        onSelectAccount={handleAccountSelect}
      />
    </div>
  );
}

export default StreamingPanel;

