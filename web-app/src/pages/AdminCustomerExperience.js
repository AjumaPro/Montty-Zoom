import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiStar, HiChartBar, HiArrowPath, HiPlus, HiUserGroup } from 'react-icons/hi2';
import { getCustomerExperience, createCustomerExperience } from '../utils/adminAuthExtended';
import './AdminCommon.css';

function AdminCustomerExperience() {
  const [experienceData, setExperienceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [experienceForm, setExperienceForm] = useState({
    userId: '',
    callId: '',
    interactionType: 'call',
    satisfactionScore: '',
    npsScore: '',
    csatScore: '',
    feedback: '',
    tags: []
  });

  useEffect(() => {
    loadExperience();
  }, []);

  const loadExperience = async () => {
    setLoading(true);
    const data = await getCustomerExperience();
    setExperienceData(data);
    setLoading(false);
  };

  const handleCreateExperience = async (e) => {
    e.preventDefault();
    const result = await createCustomerExperience(experienceForm);
    if (result) {
      toast.success('Experience record created successfully');
      setShowCreateModal(false);
      setExperienceForm({
        userId: '',
        callId: '',
        interactionType: 'call',
        satisfactionScore: '',
        npsScore: '',
        csatScore: '',
        feedback: '',
        tags: []
      });
      loadExperience();
    }
  };

  if (loading || !experienceData) {
    return (
      <div className="admin-customer-experience-loading">
        <div className="admin-spinner"></div>
        <p>Loading customer experience data...</p>
      </div>
    );
  }

  const { experiences, metrics } = experienceData;

  return (
    <div className="admin-customer-experience-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customer Experience</h1>
          <p className="admin-page-subtitle">Track customer satisfaction and experience metrics</p>
        </div>
        <div className="admin-page-header-right">
          <button className="admin-action-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <HiPlus />
            Add Experience
          </button>
          <button className="admin-action-btn admin-btn-secondary" onClick={loadExperience}>
            <HiArrowPath />
            Refresh
          </button>
        </div>
      </div>

      {metrics && (
        <div className="admin-experience-metrics-grid">
          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <HiStar />
            </div>
            <div className="admin-metric-info">
              <div className="admin-metric-label">Avg Satisfaction</div>
              <div className="admin-metric-value">
                {metrics.avg_satisfaction || metrics.avgSatisfaction 
                  ? (metrics.avg_satisfaction || metrics.avgSatisfaction).toFixed(1) 
                  : '0.0'}/5
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <HiChartBar />
            </div>
            <div className="admin-metric-info">
              <div className="admin-metric-label">NPS Score</div>
              <div className="admin-metric-value">
                {metrics.avg_nps || metrics.avgNps 
                  ? (metrics.avg_nps || metrics.avgNps).toFixed(1) 
                  : '0.0'}/10
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <HiChartBar />
            </div>
            <div className="admin-metric-info">
              <div className="admin-metric-label">CSAT Score</div>
              <div className="admin-metric-value">
                {metrics.avg_csat || metrics.avgCsat 
                  ? (metrics.avg_csat || metrics.avgCsat).toFixed(1) 
                  : '0.0'}/5
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
              <HiUserGroup />
            </div>
            <div className="admin-metric-info">
              <div className="admin-metric-label">Total Interactions</div>
              <div className="admin-metric-value">
                {metrics.total_interactions || metrics.totalInteractions || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-experience-list">
        <h2 className="admin-section-title">Experience Records</h2>
        {experiences.length === 0 ? (
          <div className="admin-empty-state">
            <p>No experience records found</p>
          </div>
        ) : (
          experiences.map(exp => (
            <div key={exp.id} className="admin-experience-card">
              <div className="admin-experience-header">
                <div>
                  <h3>User: {exp.user_id || exp.userId}</h3>
                  <p className="admin-experience-type">{exp.interaction_type || exp.interactionType}</p>
                </div>
                <div className="admin-experience-scores">
                  {exp.satisfaction_score && (
                    <div className="admin-score-badge">
                      <span>Sat: {exp.satisfaction_score}</span>
                    </div>
                  )}
                  {exp.nps_score !== null && exp.nps_score !== undefined && (
                    <div className="admin-score-badge">
                      <span>NPS: {exp.nps_score}</span>
                    </div>
                  )}
                  {exp.csat_score && (
                    <div className="admin-score-badge">
                      <span>CSAT: {exp.csat_score}</span>
                    </div>
                  )}
                </div>
              </div>
              {exp.feedback && (
                <p className="admin-experience-feedback">{exp.feedback}</p>
              )}
              <div className="admin-experience-footer">
                <span>{new Date(exp.created_at || exp.createdAt).toLocaleString()}</span>
                {exp.agent_id && <span>Agent: {exp.agent_id}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add Customer Experience</h2>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateExperience}>
              <div className="admin-form-group">
                <label>User ID *</label>
                <input
                  type="text"
                  value={experienceForm.userId}
                  onChange={(e) => setExperienceForm({ ...experienceForm, userId: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Call ID</label>
                <input
                  type="text"
                  value={experienceForm.callId}
                  onChange={(e) => setExperienceForm({ ...experienceForm, callId: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Satisfaction Score (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={experienceForm.satisfactionScore}
                  onChange={(e) => setExperienceForm({ ...experienceForm, satisfactionScore: parseInt(e.target.value) })}
                />
              </div>
              <div className="admin-form-group">
                <label>NPS Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={experienceForm.npsScore}
                  onChange={(e) => setExperienceForm({ ...experienceForm, npsScore: parseInt(e.target.value) })}
                />
              </div>
              <div className="admin-form-group">
                <label>CSAT Score (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={experienceForm.csatScore}
                  onChange={(e) => setExperienceForm({ ...experienceForm, csatScore: parseInt(e.target.value) })}
                />
              </div>
              <div className="admin-form-group">
                <label>Feedback</label>
                <textarea
                  value={experienceForm.feedback}
                  onChange={(e) => setExperienceForm({ ...experienceForm, feedback: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomerExperience;

