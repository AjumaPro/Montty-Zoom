import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';
import { getContentItems, createContentItem } from '../utils/adminAuthExtended';
import './AdminCommon.css';

function AdminContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'faq', title: '', content: '', published: false });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const data = await getContentItems();
    setItems(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createContentItem(formData);
    if (result) {
      toast.success('Content created successfully');
      setShowModal(false);
      setFormData({ type: 'faq', title: '', content: '', published: false });
      loadContent();
    }
  };

  if (loading) {
    return (
      <div className="admin-content-loading">
        <div className="admin-spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="admin-content-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Content Management</h1>
          <p className="admin-page-subtitle">Manage FAQs, help articles, and announcements</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <HiPlus />
          Add Content
        </button>
      </div>

      <div className="admin-content-list">
        {items.map(item => (
          <div key={item.id} className="admin-content-item">
            <div className="admin-content-item-header">
              <h3>{item.title}</h3>
              <span className="admin-content-type">{item.type}</span>
            </div>
            <p className="admin-content-preview">{item.content.substring(0, 150)}...</p>
            <div className="admin-content-actions">
              <button className="admin-icon-btn"><HiPencil /></button>
              <button className="admin-icon-btn admin-icon-btn-danger"><HiTrash /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Create Content</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="faq">FAQ</option>
                  <option value="help">Help Article</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="8"
                  required
                />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
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

export default AdminContent;

