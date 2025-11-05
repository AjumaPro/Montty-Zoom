import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiArrowPath,
  HiEye,
  HiPaperAirplane,
  HiCodeBracket,
  HiMagnifyingGlass,
  HiFunnel,
  HiEnvelope
} from 'react-icons/hi2';
import { getEmailTemplates, createEmailTemplate, sendTestEmail } from '../utils/adminAuthExtended';
import './AdminCommon.css';
import './AdminEmailTemplates.css';

function AdminEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({ 
    name: '', 
    subject: '', 
    body: '', 
    type: 'general',
    variables: [],
    isHtml: false
  });
  const [testEmail, setTestEmail] = useState('');

  // Available template variables
  const availableVariables = [
    { key: '{{userName}}', label: 'User Name', description: 'Customer\'s full name' },
    { key: '{{userEmail}}', label: 'User Email', description: 'Customer\'s email address' },
    { key: '{{planName}}', label: 'Plan Name', description: 'Subscription plan name' },
    { key: '{{amount}}', label: 'Amount', description: 'Payment amount' },
    { key: '{{date}}', label: 'Date', description: 'Current date' },
    { key: '{{companyName}}', label: 'Company Name', description: 'Your company name' },
    { key: '{{supportLink}}', label: 'Support Link', description: 'Link to support page' },
    { key: '{{unsubscribeLink}}', label: 'Unsubscribe Link', description: 'Link to unsubscribe' },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await getEmailTemplates();
    setTemplates(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createEmailTemplate(formData);
    if (result) {
      toast.success('Template created successfully');
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '', type: 'general', variables: [], isHtml: false });
      loadTemplates();
    }
  };

  const handleInsertVariable = (variable) => {
    const textarea = document.getElementById('template-body');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData({ ...formData, body: newText });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleSendTest = async () => {
    if (!testEmail || !selectedTemplate) {
      toast.error('Please enter a test email address');
      return;
    }

    const result = await sendTestEmail(selectedTemplate.id, testEmail);
    if (result) {
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    }
  };

  const processTemplate = (body, variables = {}) => {
    let processed = body;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processed;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="admin-templates-loading">
        <div className="admin-spinner"></div>
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="admin-templates-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Email Templates</h1>
          <p className="admin-page-subtitle">Create and manage email templates with variables and preview</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <HiPlus />
          Add Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="admin-templates-filters">
        <div className="admin-search-box">
          <HiMagnifyingGlass className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <select 
          className="admin-select-medium"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="welcome">Welcome</option>
          <option value="invoice">Invoice</option>
          <option value="reminder">Reminder</option>
          <option value="notification">Notification</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="admin-templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="admin-empty-state admin-empty-state-large">
            <HiEnvelope className="admin-empty-icon" />
            <p>No templates found</p>
            <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
              <HiPlus />
              Create Your First Template
            </button>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div key={template.id} className="admin-template-card">
              <div className="admin-template-card-header">
                <div>
                  <h3>{template.name}</h3>
                  <span className={`admin-template-type-badge admin-type-${template.type}`}>
                    {template.type}
                  </span>
                </div>
                <div className="admin-template-card-actions">
                  <button 
                    className="admin-icon-btn"
                    onClick={() => handlePreview(template)}
                    title="Preview"
                  >
                    <HiEye />
                  </button>
                  <button 
                    className="admin-icon-btn"
                    onClick={() => {
                      setFormData({ ...template, isHtml: template.is_html || false });
                      setSelectedTemplate(template);
                      setShowModal(true);
                    }}
                    title="Edit"
                  >
                    <HiPencil />
                  </button>
                </div>
              </div>
              <div className="admin-template-card-body">
                <p className="admin-template-subject">{template.subject}</p>
                <p className="admin-template-preview">
                  {template.body.substring(0, 150)}...
                </p>
                {template.variables && template.variables.length > 0 && (
                  <div className="admin-template-variables">
                    <span className="admin-variables-label">Variables:</span>
                    {template.variables.map((varName, idx) => (
                      <span key={idx} className="admin-variable-tag">{varName}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowModal(false);
          setSelectedTemplate(null);
        }}>
          <div className="admin-modal-content admin-template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedTemplate ? 'Edit Template' : 'Create Email Template'}</h2>
              <button className="admin-modal-close" onClick={() => {
                setShowModal(false);
                setSelectedTemplate(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Template Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="general">General</option>
                    <option value="welcome">Welcome</option>
                    <option value="invoice">Invoice</option>
                    <option value="reminder">Reminder</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Email subject line"
                />
              </div>

              <div className="admin-form-group">
                <label>Available Variables</label>
                <div className="admin-variables-picker">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      className="admin-variable-btn"
                      onClick={() => handleInsertVariable(variable.key)}
                      title={variable.description}
                    >
                      <HiCodeBracket />
                      {variable.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label>Email Body *</label>
                <textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows="12"
                  required
                  placeholder="Email body content. Use variables like {{userName}}, {{userEmail}}, etc."
                  className="admin-template-textarea"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isHtml}
                    onChange={(e) => setFormData({ ...formData, isHtml: e.target.checked })}
                  />
                  <span>HTML Format</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => {
                  setShowModal(false);
                  setSelectedTemplate(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  {selectedTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowPreview(false);
          setSelectedTemplate(null);
        }}>
          <div className="admin-modal-content admin-template-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Template Preview: {selectedTemplate.name}</h2>
              <button className="admin-modal-close" onClick={() => {
                setShowPreview(false);
                setSelectedTemplate(null);
              }}>×</button>
            </div>
            <div className="admin-template-preview-content">
              <div className="admin-preview-section">
                <label>Subject:</label>
                <div className="admin-preview-subject">
                  {processTemplate(selectedTemplate.subject, {
                    userName: 'John Doe',
                    userEmail: 'john@example.com',
                    planName: 'Pro Plan',
                    amount: '$4.99',
                    date: new Date().toLocaleDateString(),
                    companyName: 'Montty Zoom',
                    supportLink: 'https://support.example.com',
                    unsubscribeLink: 'https://example.com/unsubscribe'
                  })}
                </div>
              </div>
              
              <div className="admin-preview-section">
                <label>Body Preview:</label>
                <div className="admin-preview-body">
                  {selectedTemplate.is_html || selectedTemplate.isHtml ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: processTemplate(selectedTemplate.body, {
                        userName: 'John Doe',
                        userEmail: 'john@example.com',
                        planName: 'Pro Plan',
                        amount: '$4.99',
                        date: new Date().toLocaleDateString(),
                        companyName: 'Montty Zoom',
                        supportLink: 'https://support.example.com',
                        unsubscribeLink: 'https://example.com/unsubscribe'
                      })
                    }} />
                  ) : (
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {processTemplate(selectedTemplate.body, {
                        userName: 'John Doe',
                        userEmail: 'john@example.com',
                        planName: 'Pro Plan',
                        amount: '$4.99',
                        date: new Date().toLocaleDateString(),
                        companyName: 'Montty Zoom',
                        supportLink: 'https://support.example.com',
                        unsubscribeLink: 'https://example.com/unsubscribe'
                      })}
                    </pre>
                  )}
                </div>
              </div>

              <div className="admin-preview-section">
                <label>Send Test Email:</label>
                <div className="admin-test-email-input">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address to test"
                    className="admin-input-medium"
                  />
                  <button 
                    type="button"
                    className="admin-action-btn admin-btn-primary"
                    onClick={handleSendTest}
                  >
                    <HiPaperAirplane />
                    Send Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmailTemplates;

