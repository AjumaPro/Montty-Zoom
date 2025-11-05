import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiXMark, HiQrCode, HiLink, HiClipboard, HiCheck, HiArrowDownTray, HiEnvelope } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './ShareMeeting.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

function ShareMeeting({ isOpen, onClose, roomId, roomPassword }) {
  const [qrCode, setQrCode] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && roomId) {
      generateShareUrl();
      loadQRCode();
    }
  }, [isOpen, roomId, roomPassword]);

  const generateShareUrl = () => {
    // Generate shareable URL with room ID and password
    const url = new URL(`${FRONTEND_URL}/room/${roomId}`);
    if (roomPassword) {
      url.searchParams.append('password', roomPassword);
    }
    setMeetingUrl(url.toString());
  };

  const loadQRCode = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      // Create URL with password for QR code
      const url = new URL(`${FRONTEND_URL}/room/${roomId}`);
      if (roomPassword) {
        url.searchParams.append('password', roomPassword);
      }
      
      // Try to get QR code from backend with custom URL
      const response = await axios.post(`${API_URL}/api/room/qr-generate`, {
        url: url.toString()
      });
      
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      toast.success('Meeting URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy URL');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Meeting',
          text: 'Join my meeting',
          url: meetingUrl
        });
        toast.success('Meeting link shared!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) {
      toast.error('QR code not available');
      return;
    }

    try {
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `meeting-qr-${roomId.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join My Meeting');
    const body = encodeURIComponent(
      `You're invited to join my meeting!\n\n` +
      `Meeting URL: ${meetingUrl}\n\n` +
      `Click the link above or scan the QR code (see attached image) to join.\n\n` +
      `Note: This is a secure meeting link with password included.\n\n` +
      `---\n` +
      `To join:\n` +
      `1. Click the meeting URL above, or\n` +
      `2. Scan the QR code with your phone camera\n\n` +
      `The meeting link includes all necessary access credentials.`
    );
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    try {
      // Create a temporary anchor element and programmatically click it
      // This is the most reliable method for opening mailto links
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger click event
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      // Also copy email content to clipboard as backup
      const emailContent = `Subject: Join My Meeting\n\nYou're invited to join my meeting!\n\nMeeting URL: ${meetingUrl}\n\nClick the link above or scan the QR code to join.\n\nNote: This is a secure meeting link with password included.`;
      
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText(emailContent);
          toast.success('Email client opening... Email content also copied to clipboard!');
        } catch (clipboardError) {
          toast.info('Email client opening... If it doesn\'t open, please copy the meeting URL manually.');
        }
      }, 200);
      
    } catch (error) {
      console.error('Error opening email client:', error);
      // Fallback: copy email content to clipboard
      const emailContent = `Subject: Join My Meeting\n\nYou're invited to join my meeting!\n\nMeeting URL: ${meetingUrl}\n\nClick the link above or scan the QR code to join.\n\nNote: This is a secure meeting link with password included.`;
      navigator.clipboard.writeText(emailContent).then(() => {
        toast.success('Email content copied to clipboard! Paste it in your email client.');
      }).catch(() => {
        toast.error('Unable to open email client. Please copy the meeting URL manually: ' + meetingUrl);
      });
    }
  };

  const shareWithQRCode = async () => {
    if (!qrCode) {
      toast.error('QR code not available');
      return;
    }

    // Convert base64 QR code to blob
    try {
      const response = await fetch(qrCode);
      const blob = await response.blob();
      const file = new File([blob], `meeting-qr-${roomId.substring(0, 8)}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Join My Meeting',
            text: `Join my meeting! Meeting URL: ${meetingUrl}`,
            url: meetingUrl,
            files: [file]
          });
          toast.success('Meeting shared with QR code!');
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error sharing with QR code:', error);
            // Fallback to regular share
            handleShare();
          }
        }
      } else {
        // Fallback to regular share if file sharing not supported
        handleShare();
      }
    } catch (error) {
      console.error('Error preparing QR code for share:', error);
      handleShare();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-meeting-overlay" onClick={onClose}>
      <div className="share-meeting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-meeting-header">
          <h2>Share Meeting</h2>
          <button className="share-meeting-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="share-meeting-content">
          <div className="share-section">
            <label className="share-label">
              <HiLink className="share-icon" />
              Meeting URL
            </label>
            <div className="url-container">
              <input
                type="text"
                value={meetingUrl}
                readOnly
                className="url-input"
              />
              <button
                className="copy-btn"
                onClick={copyToClipboard}
                title="Copy URL"
              >
                {copied ? (
                  <HiCheck className="copy-icon" />
                ) : (
                  <HiClipboard className="copy-icon" />
                )}
              </button>
            </div>
            <p className="share-hint">
              Share this URL with participants. They can click it to join the meeting.
            </p>
          </div>

          <div className="share-section">
            <label className="share-label">
              <HiQrCode className="share-icon" />
              QR Code
            </label>
            {loading ? (
              <div className="qr-loading">
                <div className="spinner"></div>
                <p>Generating QR code...</p>
              </div>
            ) : qrCode ? (
              <div className="qr-container">
                <img src={qrCode} alt="Meeting QR Code" className="qr-image" />
                <div className="qr-actions">
                  <button 
                    className="qr-action-btn download-btn" 
                    onClick={downloadQRCode}
                    title="Download QR Code"
                  >
                    <HiArrowDownTray className="qr-action-icon" />
                    Download QR
                  </button>
                  <button 
                    className="qr-action-btn email-btn" 
                    onClick={shareViaEmail}
                    title="Share via Email"
                  >
                    <HiEnvelope className="qr-action-icon" />
                    Email
                  </button>
                </div>
                <p className="qr-hint">
                  Participants can scan this QR code with their phone camera to join the meeting.
                </p>
              </div>
            ) : (
              <div className="qr-error">
                <p>Failed to generate QR code</p>
              </div>
            )}
          </div>

          <div className="share-meeting-actions">
            <button className="share-btn-primary" onClick={handleShare}>
              <HiLink style={{ fontSize: '1.1rem' }} /> Share Link
            </button>
            <button className="share-btn-email" onClick={shareViaEmail}>
              <HiEnvelope style={{ fontSize: '1.1rem' }} /> Email
            </button>
            <button className="share-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareMeeting;

