import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HiCloudArrowDown, HiArrowPath } from 'react-icons/hi2';
import { createBackup, getBackups } from '../utils/adminAuthExtended';
import './AdminCommon.css';

function AdminBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    const data = await getBackups();
    setBackups(data);
    setLoading(false);
  };

  const handleCreateBackup = async () => {
    const result = await createBackup('full');
    if (result) {
      toast.success('Backup initiated successfully');
      setTimeout(loadBackups, 1000);
    }
  };

  if (loading) {
    return (
      <div className="admin-backups-loading">
        <div className="admin-spinner"></div>
        <p>Loading backups...</p>
      </div>
    );
  }

  return (
    <div className="admin-backups-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Backup & Restore</h1>
          <p className="admin-page-subtitle">Manage system backups</p>
        </div>
        <button className="admin-action-btn admin-btn-primary" onClick={handleCreateBackup}>
          <HiCloudArrowDown />
          Create Backup
        </button>
      </div>

      <div className="admin-backups-list">
        {backups.length === 0 ? (
          <div className="admin-empty-state">
            <p>No backups found</p>
          </div>
        ) : (
          backups.map(backup => (
            <div key={backup.id} className="admin-backup-card">
              <div className="admin-backup-info">
                <h3>{backup.backup_type || backup.backupType} Backup</h3>
                <p>{backup.file_path || backup.filePath}</p>
                <p className="admin-backup-date">
                  Created: {new Date(backup.created_at || backup.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="admin-backup-status">
                <span className={`admin-status-badge admin-status-${backup.status}`}>
                  {backup.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBackups;

