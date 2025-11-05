import React from 'react';
import { HiQuestionMarkCircle, HiBookOpen, HiChatBubbleLeftRight, HiEnvelope } from 'react-icons/hi2';
import './AdminHelp.css';

function AdminHelp() {
  return (
    <div className="admin-help-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Help & Support</h1>
          <p className="admin-page-subtitle">Get help and learn how to use the admin dashboard</p>
        </div>
      </div>

      <div className="admin-help-sections">
        <div className="admin-help-card">
          <HiBookOpen className="admin-help-icon" />
          <h2>Documentation</h2>
          <p>Comprehensive guides and tutorials for using the admin dashboard</p>
          <button className="admin-action-btn admin-btn-secondary">View Docs</button>
        </div>

        <div className="admin-help-card">
          <HiQuestionMarkCircle className="admin-help-icon" />
          <h2>FAQ</h2>
          <p>Frequently asked questions and answers</p>
          <button className="admin-action-btn admin-btn-secondary">View FAQ</button>
        </div>

        <div className="admin-help-card">
          <HiChatBubbleLeftRight className="admin-help-icon" />
          <h2>Live Chat</h2>
          <p>Chat with our support team in real-time</p>
          <button className="admin-action-btn admin-btn-secondary">Start Chat</button>
        </div>

        <div className="admin-help-card">
          <HiEnvelope className="admin-help-icon" />
          <h2>Contact Us</h2>
          <p>Send us an email for assistance</p>
          <button className="admin-action-btn admin-btn-secondary">Send Email</button>
        </div>
      </div>

      <div className="admin-help-content">
        <div className="admin-help-section">
          <h2>Quick Start Guide</h2>
          <div className="admin-help-steps">
            <div className="admin-help-step">
              <span className="admin-step-number">1</span>
              <div>
                <h3>Dashboard Overview</h3>
                <p>The dashboard provides an overview of your platform metrics, including users, meetings, subscriptions, and revenue.</p>
              </div>
            </div>
            <div className="admin-help-step">
              <span className="admin-step-number">2</span>
              <div>
                <h3>User Management</h3>
                <p>View, edit, and delete users. Monitor user activity and manage user accounts.</p>
              </div>
            </div>
            <div className="admin-help-step">
              <span className="admin-step-number">3</span>
              <div>
                <h3>Meetings & Rooms</h3>
                <p>Manage scheduled meetings and active rooms. View meeting history and room details.</p>
              </div>
            </div>
            <div className="admin-help-step">
              <span className="admin-step-number">4</span>
              <div>
                <h3>Analytics</h3>
                <p>Access detailed analytics and insights about platform usage, subscription distribution, and user engagement.</p>
              </div>
            </div>
            <div className="admin-help-step">
              <span className="admin-step-number">5</span>
              <div>
                <h3>Projects & Reminders</h3>
                <p>Create and manage projects, set reminders, and track progress.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-help-section">
          <h2>Common Tasks</h2>
          <div className="admin-help-list">
            <div className="admin-help-item">
              <h3>How to add a new project?</h3>
              <p>Go to the Projects page and click "New Project". Fill in the details and save.</p>
            </div>
            <div className="admin-help-item">
              <h3>How to view user subscriptions?</h3>
              <p>Navigate to the Dashboard and check the subscriptions card, or go to Users page for detailed information.</p>
            </div>
            <div className="admin-help-item">
              <h3>How to delete a meeting?</h3>
              <p>Go to Meetings page, find the meeting you want to delete, and click the delete button.</p>
            </div>
            <div className="admin-help-item">
              <h3>How to export data?</h3>
              <p>Use the "Import Data" button on the dashboard. You can export users, meetings, and analytics data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHelp;

