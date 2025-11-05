import React, { useState, useRef } from 'react';
import { HiXMark, HiPaperClip, HiArrowDownTray } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import './FileSharePanel.css';

function FileSharePanel({ isOpen, onClose, socket, roomId, userId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    
    for (const file of selectedFiles) {
      try {
        // In a real implementation, upload to cloud storage
        // For now, we'll simulate with file metadata
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          url: URL.createObjectURL(file) // Local URL for demo
        };

        setFiles(prev => [...prev, fileData]);

        // Broadcast file to participants
        if (socket) {
          socket.emit('file-shared', {
            roomId,
            userId,
            file: fileData
          });
        }

        toast.success(`${file.name} shared successfully`);
      } catch (error) {
        console.error('Error sharing file:', error);
        toast.error(`Failed to share ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="file-share-panel-overlay" onClick={onClose}>
      <div className="file-share-panel" onClick={(e) => e.stopPropagation()}>
        <div className="file-share-header">
          <h2>File Sharing</h2>
          <button onClick={onClose} className="close-btn">
            <HiXMark />
          </button>
        </div>

        <div className="file-share-content">
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="upload-btn">
              <HiPaperClip />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </label>
          </div>

          <div className="files-list">
            <h3>Shared Files ({files.length})</h3>
            {files.length === 0 ? (
              <p className="no-files">No files shared yet</p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <HiPaperClip className="file-icon" />
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => downloadFile(file)} className="download-btn">
                    <HiArrowDownTray />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileSharePanel;

