import React from 'react';
import './ReactionsPanel.css';

const REACTIONS = ['👍', '👏', '❤️', '😂', '😮', '🎉', '🔥', '✅'];

const ReactionsPanel = ({ socket, roomId, userId, userName, isOpen, onClose, onReaction }) => {
  if (!isOpen) return null;

  const sendReaction = (reaction) => {
    if (socket) {
      socket.emit('send-reaction', {
        roomId,
        userId,
        userName,
        reaction
      });
    }
    if (onReaction) {
      onReaction(reaction);
    }
  };

  return (
    <div className="reactions-panel">
      <div className="reactions-grid">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction}
            onClick={() => sendReaction(reaction)}
            className="reaction-btn"
            title={reaction}
          >
            {reaction}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionsPanel;

