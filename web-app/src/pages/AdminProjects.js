import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil, HiTrash, HiXMark } from 'react-icons/hi2';
import { getAllProjects, createProject, updateProject, deleteProject } from '../utils/adminAuth';
import './AdminProjects.css';

function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending',
    priority: 'medium'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await getAllProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast.error('Title and due date are required');
      return;
    }

    let result;
    if (editingProject) {
      result = await updateProject(editingProject.id, formData);
    } else {
      result = await createProject(formData);
    }

    if (result) {
      toast.success(`Project ${editingProject ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', dueDate: '', status: 'pending', priority: 'medium' });
      loadProjects();
    } else {
      toast.error(`Failed to ${editingProject ? 'update' : 'create'} project`);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      dueDate: project.dueDate.split('T')[0],
      status: project.status,
      priority: project.priority || 'medium'
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    const success = await deleteProject(projectId);
    if (success) {
      toast.success('Project deleted successfully');
      loadProjects();
    } else {
      toast.error('Failed to delete project');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      'in-progress': '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#9ca3af';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    return colors[priority] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className="admin-projects-loading">
        <div className="admin-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="admin-projects-container">
      <div className="admin-projects-header">
        <div>
          <h1 className="admin-page-title">Projects Management</h1>
          <p className="admin-page-subtitle">Manage platform projects</p>
        </div>
        <button
          className="admin-action-btn admin-btn-primary"
          onClick={() => {
            setEditingProject(null);
            setFormData({ title: '', description: '', dueDate: '', status: 'pending', priority: 'medium' });
            setShowModal(true);
          }}
        >
          <HiPlus />
          New Project
        </button>
      </div>

      <div className="admin-projects-grid">
        {projects.length === 0 ? (
          <div className="admin-empty-state-full">
            <p>No projects found</p>
            <button
              className="admin-action-btn admin-btn-primary"
              onClick={() => setShowModal(true)}
            >
              <HiPlus />
              Create First Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="admin-project-card">
              <div className="admin-project-header">
                <h3>{project.title}</h3>
                <div className="admin-project-actions">
                  <button
                    className="admin-icon-btn"
                    onClick={() => handleEdit(project)}
                    title="Edit"
                  >
                    <HiPencil />
                  </button>
                  <button
                    className="admin-icon-btn admin-icon-btn-danger"
                    onClick={() => handleDelete(project.id)}
                    title="Delete"
                  >
                    <HiTrash />
                  </button>
                </div>
              </div>
              {project.description && (
                <p className="admin-project-description">{project.description}</p>
              )}
              <div className="admin-project-meta">
                <div className="admin-project-badges">
                  <span
                    className="admin-badge"
                    style={{ backgroundColor: getStatusColor(project.status) + '20', color: getStatusColor(project.status) }}
                  >
                    {project.status}
                  </span>
                  <span
                    className="admin-badge"
                    style={{ backgroundColor: getPriorityColor(project.priority) + '20', color: getPriorityColor(project.priority) }}
                  >
                    {project.priority}
                  </span>
                </div>
                <p className="admin-project-date">
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <HiXMark />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-project-form">
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
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-action-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-btn-primary">
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProjects;

