import React from 'react';
import { HiPlus, HiVideoCamera } from 'react-icons/hi2';
import './AdminProjectList.css';

function AdminProjectList({ projects = [], onAddProject }) {
  const displayProjects = projects.length > 0 ? projects : [];

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '🔵',
      'in-progress': '🟡',
      completed: '🟢',
      cancelled: '🔴'
    };
    return colors[status] || '📋';
  };

  return (
    <div className="admin-project-list-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Projects</h3>
        <button className="admin-add-btn" onClick={onAddProject}>
          <HiPlus />
          New
        </button>
      </div>
      <div className="admin-project-list">
        {displayProjects.length === 0 ? (
          <div className="admin-empty-projects">
            <p>No projects yet</p>
            <button className="admin-add-btn-small" onClick={onAddProject}>
              Create one
            </button>
          </div>
        ) : (
          displayProjects.map((project) => (
            <div key={project.id} className="admin-project-item">
              <div className="admin-project-icon">{getStatusColor(project.status)}</div>
              <div className="admin-project-info">
                <div className="admin-project-name">{project.title || project.name}</div>
                <div className="admin-project-date">Due date: {formatDate(project.dueDate)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminProjectList;

