import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiEnvelope, 
  HiPaperAirplane, 
  HiPlus, 
  HiXMark, 
  HiDocumentText,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiMagnifyingGlass,
  HiPencil,
  HiTrash
} from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './Emails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Emails() {
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent', 'templates', 'compose'
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    meetingId: '',
    attachQR: false
  });

  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    loadEmails();
    loadTemplates();
  }, []);

  const loadEmails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/emails`);
      setEmails(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading emails:', error);
      // Initialize with empty array if endpoint doesn't exist yet
      setEmails([]);
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = localStorage.getItem('emailTemplates');
      if (templatesData) {
        setTemplates(JSON.parse(templatesData));
      } else {
        // Initialize with default templates
        const defaultTemplates = [
          {
            id: 'meeting-invitation',
            name: 'Meeting Invitation',
            subject: 'You\'re invited to join my meeting',
            body: `Hello,\n\nYou're invited to join my meeting.\n\nMeeting URL: {{meetingUrl}}\n\nClick the link above to join the meeting.\n\nBest regards`
          },
          {
            id: 'meeting-reminder',
            name: 'Meeting Reminder',
            subject: 'Reminder: Meeting in {{time}}',
            body: `Hello,\n\nThis is a reminder that you have a meeting scheduled.\n\nMeeting: {{meetingTitle}}\nTime: {{meetingTime}}\n\nMeeting URL: {{meetingUrl}}\n\nBest regards`
          },
          {
            id: 'meeting-follow-up',
            name: 'Meeting Follow-up',
            subject: 'Follow-up: {{meetingTitle}}',
            body: `Hello,\n\nThank you for attending the meeting.\n\nMeeting: {{meetingTitle}}\nDate: {{meetingDate}}\n\nBest regards`
          }
        ];
        setTemplates(defaultTemplates);
        localStorage.setItem('emailTemplates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const recipients = composeData.to.split(',').map(email => email.trim());
      
      for (const email of recipients) {
        if (!emailRegex.test(email)) {
          toast.error(`Invalid email address: ${email}`);
          return;
        }
      }

      // In a real app, this would send the email via backend
      const emailRecord = {
        id: `email-${Date.now()}`,
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
        status: 'sent',
        sentAt: new Date().toISOString(),
        meetingId: composeData.meetingId || null
      };

      // Save to localStorage (in production, this would be saved to backend)
      const existingEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
      existingEmails.push(emailRecord);
      localStorage.setItem('sentEmails', JSON.stringify(existingEmails));

      setEmails([emailRecord, ...emails]);
      toast.success('Email sent successfully!');
      setShowComposeModal(false);
      setComposeData({
        to: '',
        subject: '',
        body: '',
        meetingId: '',
        attachQR: false
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  const handleSaveTemplate = () => {
    if (!templateData.name.trim() || !templateData.subject.trim() || !templateData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newTemplate = {
        id: selectedTemplate?.id || `template-${Date.now()}`,
        name: templateData.name,
        subject: templateData.subject,
        body: templateData.body
      };

      let updatedTemplates;
      if (selectedTemplate) {
        updatedTemplates = templates.map(t => t.id === selectedTemplate.id ? newTemplate : t);
      } else {
        updatedTemplates = [...templates, newTemplate];
      }

      setTemplates(updatedTemplates);
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      toast.success(selectedTemplate ? 'Template updated!' : 'Template saved!');
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setTemplateData({ name: '', subject: '', body: '' });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleUseTemplate = (template) => {
    setComposeData({
      ...composeData,
      subject: template.subject,
      body: template.body
    });
    setShowTemplateModal(false);
    setShowComposeModal(true);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      toast.success('Template deleted');
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
    setShowTemplateModal(true);
  };

  const filteredEmails = emails.filter(email => 
    email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="emails-page">
      <div className="emails-header">
        <div>
          <h1 className="emails-title">Emails</h1>
          <p className="emails-subtitle">Manage your email communications and templates</p>
        </div>
        <div className="emails-header-actions">
          <button 
            className="btn-primary" 
            onClick={() => setShowComposeModal(true)}
          >
            <HiPlus />
            Compose
          </button>
        </div>
      </div>

      <div className="emails-tabs">
        <button 
          className={`email-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <HiPaperAirplane />
          Sent Emails ({emails.length})
        </button>
        <button 
          className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <HiDocumentText />
          Templates ({templates.length})
        </button>
      </div>

      <div className="emails-search">
        <HiMagnifyingGlass className="search-icon" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'sent' ? 'emails' : 'templates'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="emails-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'sent' ? (
          <div className="emails-list">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email) => (
                <div key={email.id} className="email-item">
                  <div className="email-item-header">
                    <div className="email-item-info">
                      <div className="email-to">
                        <HiEnvelope className="email-icon" />
                        <span>{email.to}</span>
                      </div>
                      <div className="email-subject">{email.subject}</div>
                    </div>
                    <div className="email-item-meta">
                      <div className={`email-status ${email.status}`}>
                        {email.status === 'sent' ? (
                          <HiCheckCircle className="status-icon" />
                        ) : (
                          <HiXCircle className="status-icon" />
                        )}
                        <span>{email.status}</span>
                      </div>
                      <div className="email-date">
                        <HiClock className="date-icon" />
                        {formatDate(email.sentAt)}
                      </div>
                    </div>
                  </div>
                  <div className="email-item-preview">
                    {email.body.substring(0, 150)}...
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <HiEnvelope className="empty-icon" />
                <h3>No emails sent yet</h3>
                <p>Start by composing a new email</p>
                <button className="btn-primary" onClick={() => setShowComposeModal(true)}>
                  <HiPlus />
                  Compose Email
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="templates-list">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div key={template.id} className="template-item">
                  <div className="template-header">
                    <h3 className="template-name">{template.name}</h3>
                    <div className="template-actions">
                      <button
                        className="template-action-btn"
                        onClick={() => handleUseTemplate(template)}
                        title="Use Template"
                      >
                        <HiPaperAirplane />
                      </button>
                      <button
                        className="template-action-btn"
                        onClick={() => handleEditTemplate(template)}
                        title="Edit Template"
                      >
                        <HiPencil />
                      </button>
                      <button
                        className="template-action-btn delete"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete Template"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                  <div className="template-subject">{template.subject}</div>
                  <div className="template-body">{template.body.substring(0, 200)}...</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <HiDocumentText className="empty-icon" />
                <h3>No templates yet</h3>
                <p>Create your first email template</p>
                <button className="btn-primary" onClick={() => setShowTemplateModal(true)}>
                  <HiPlus />
                  Create Template
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="modal-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="modal-content email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Compose Email</h2>
              <button className="modal-close" onClick={() => setShowComposeModal(false)}>
                <HiXMark />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>To</label>
                <input
                  type="text"
                  placeholder="recipient@example.com (comma-separated for multiple)"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea
                  rows={10}
                  placeholder="Email body"
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={composeData.attachQR}
                    onChange={(e) => setComposeData({ ...composeData, attachQR: e.target.checked })}
                  />
                  Attach QR code (if available)
                </label>
              </div>
              <div className="template-selector">
                <label>Use Template:</label>
                <select
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) handleUseTemplate(template);
                  }}
                  value=""
                >
                  <option value="">Select a template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowComposeModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSendEmail}>
                <HiPaperAirplane />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setTemplateData({ name: '', subject: '', body: '' });
        }}>
          <div className="modal-content email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTemplate ? 'Edit Template' : 'Create Template'}</h2>
              <button className="modal-close" onClick={() => {
                setShowTemplateModal(false);
                setSelectedTemplate(null);
                setTemplateData({ name: '', subject: '', body: '' });
              }}>
                <HiXMark />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Template Name</label>
                <input
                  type="text"
                  placeholder="e.g., Meeting Invitation"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Email subject (use {{variables}} for dynamic content)"
                  value={templateData.subject}
                  onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea
                  rows={10}
                  placeholder="Email body (use {{variables}} for dynamic content)"
                  value={templateData.body}
                  onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                />
                <div className="template-vars-hint">
                  <strong>Available variables:</strong> {'{{meetingUrl}}'}, {'{{meetingTitle}}'}, {'{{meetingDate}}'}, {'{{meetingTime}}'}, {'{{userName}}'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowTemplateModal(false);
                setSelectedTemplate(null);
                setTemplateData({ name: '', subject: '', body: '' });
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveTemplate}>
                {selectedTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Emails;

