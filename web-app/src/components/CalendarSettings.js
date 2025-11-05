import React, { useState, useEffect } from 'react';
import { HiCalendar, HiCheckCircle, HiXCircle, HiArrowPath, HiCloudArrowUp } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import axios from 'axios';
import './CalendarSettings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CalendarSettings() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      const response = await axios.get(`${API_URL}/api/calendar/status`, {
        params: { userId }
      });
      setConnectionStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking calendar status:', error);
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      const response = await axios.get(`${API_URL}/api/calendar/google/auth-url`, {
        params: { userId }
      });
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        response.data.authUrl,
        'Google Calendar Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          checkConnectionStatus();
        }
      }, 1000);

      // Listen for message from popup (if using postMessage)
      window.addEventListener('message', (event) => {
        if (event.data === 'calendar-connected') {
          checkConnectionStatus();
          popup.close();
        }
      });
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      await axios.post(`${API_URL}/api/calendar/disconnect`, { userId });
      setConnectionStatus(null);
      toast.success('Calendar disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await axios.get(`${API_URL}/api/calendar/sync`, {
        params: { userId, startDate, endDate }
      });
      
      toast.success(`Synced ${response.data.events.length} events from calendar`);
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error(error.response?.data?.error || 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const handleImportICS = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const icsContent = e.target.result;
          const response = await axios.post(`${API_URL}/api/calendar/import/ics`, {
            icsContent
          });
          
          toast.success(`Imported ${response.data.count} events from ICS file`);
        } catch (error) {
          console.error('Error importing ICS file:', error);
          toast.error(error.response?.data?.error || 'Failed to import ICS file');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="calendar-settings">
        <div className="loading">Loading calendar settings...</div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;

  return (
    <div className="calendar-settings">
      <div className="calendar-section">
        <div className="calendar-header">
          <HiCalendar className="calendar-icon" />
          <h3 className="calendar-title">Calendar Integration</h3>
        </div>

        <div className="calendar-providers">
          {/* Google Calendar */}
          <div className="calendar-provider-card">
            <div className="provider-header">
              <div className="provider-info">
                <div className="provider-logo google-logo">G</div>
                <div>
                  <h4 className="provider-name">Google Calendar</h4>
                  <p className="provider-description">Sync meetings with your Google Calendar</p>
                </div>
              </div>
              {isConnected && connectionStatus.connection?.provider === 'google' ? (
                <div className="connection-status connected">
                  <HiCheckCircle className="status-icon" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="connection-status disconnected">
                  <HiXCircle className="status-icon" />
                  <span>Not Connected</span>
                </div>
              )}
            </div>

            {isConnected && connectionStatus.connection?.provider === 'google' ? (
              <div className="provider-actions">
                <button className="btn-secondary" onClick={handleSync} disabled={syncing}>
                  <HiArrowPath className={syncing ? 'spinning' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button className="btn-danger" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={handleConnectGoogle}>
                Connect Google Calendar
              </button>
            )}
          </div>

          {/* Outlook Calendar (Placeholder) */}
          <div className="calendar-provider-card">
            <div className="provider-header">
              <div className="provider-info">
                <div className="provider-logo outlook-logo">O</div>
                <div>
                  <h4 className="provider-name">Microsoft Outlook</h4>
                  <p className="provider-description">Connect your Outlook calendar (Coming Soon)</p>
                </div>
              </div>
              <div className="connection-status disconnected">
                <HiXCircle className="status-icon" />
                <span>Not Available</span>
              </div>
            </div>
            <button className="btn-secondary" disabled>
              Coming Soon
            </button>
          </div>

          {/* Apple iCal (Placeholder) */}
          <div className="calendar-provider-card">
            <div className="provider-header">
              <div className="provider-info">
                <div className="provider-logo apple-logo">🍎</div>
                <div>
                  <h4 className="provider-name">Apple iCal</h4>
                  <p className="provider-description">Import events from iCal files</p>
                </div>
              </div>
            </div>
            <div className="provider-actions">
              <label className="btn-secondary" htmlFor="ics-file-input">
                <HiCloudArrowUp />
                Import ICS File
                <input
                  id="ics-file-input"
                  type="file"
                  accept=".ics,.ical"
                  onChange={handleImportICS}
                  style={{ display: 'none' }}
                  disabled={importing}
                />
              </label>
              {importing && <span>Importing...</span>}
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="calendar-info">
            <p className="info-text">
              Connected to <strong>{connectionStatus.connection?.provider}</strong> calendar
              {connectionStatus.connection?.connectedAt && (
                <span> since {new Date(connectionStatus.connection.connectedAt).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarSettings;

