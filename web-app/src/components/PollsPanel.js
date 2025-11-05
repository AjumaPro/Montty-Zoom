import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './PollsPanel.css';

const PollsPanel = ({ socket, roomId, userId, isHost, isOpen, onClose }) => {
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    if (!socket) return;

    const handlePollCreated = (poll) => {
      setPolls(prev => [...prev, poll]);
    };

    const handlePollUpdated = (poll) => {
      setPolls(prev => prev.map(p => p.id === poll.id ? poll : p));
    };

    socket.on('poll-created', handlePollCreated);
    socket.on('poll-updated', handlePollUpdated);

    return () => {
      socket.off('poll-created', handlePollCreated);
      socket.off('poll-updated', handlePollUpdated);
    };
  }, [socket]);

  const createPoll = () => {
    if (!question.trim() || options.filter(opt => opt.trim()).length < 2) {
      toast.error('Please enter a question and at least 2 options');
      return;
    }

    if (socket && isHost) {
      socket.emit('create-poll', {
        roomId,
        userId,
        question,
        options: options.filter(opt => opt.trim())
      });
      setQuestion('');
      setOptions(['', '']);
      setShowCreate(false);
    }
  };

  const votePoll = (pollId, optionIndex) => {
    if (socket) {
      socket.emit('vote-poll', { roomId, userId, pollId, optionIndex });
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!isOpen) return null;

  return (
    <div className="polls-panel">
      <div className="polls-header">
        <h3>Polls</h3>
        {isHost && (
          <button onClick={() => setShowCreate(!showCreate)} className="create-poll-btn">
            + New Poll
          </button>
        )}
        <button onClick={onClose} className="polls-close-btn">×</button>
      </div>

      {showCreate && isHost && (
        <div className="create-poll-form">
          <input
            type="text"
            placeholder="Poll question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="poll-question-input"
          />
          <div className="poll-options">
            {options.map((opt, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => updateOption(index, e.target.value)}
                className="poll-option-input"
              />
            ))}
          </div>
          <div className="poll-actions">
            <button onClick={addOption} className="add-option-btn">+ Add Option</button>
            <button onClick={createPoll} className="create-btn">Create Poll</button>
          </div>
        </div>
      )}

      <div className="polls-list">
        {polls.map((poll) => {
          const hasVoted = poll.votes[userId] !== undefined;
          const totalVotes = Object.keys(poll.votes).length;
          
          return (
            <div key={poll.id} className="poll-item">
              <h4 className="poll-question">{poll.question}</h4>
              <div className="poll-options-list">
                {poll.options.map((option, index) => {
                  const votes = option.votes;
                  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  const isSelected = poll.votes[userId] === index;
                  
                  return (
                    <div
                      key={index}
                      className={`poll-option ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
                      onClick={() => !hasVoted && votePoll(poll.id, index)}
                    >
                      <div className="poll-option-text">{option.text}</div>
                      {hasVoted && (
                        <div className="poll-result">
                          <div className="poll-bar" style={{ width: `${percentage}%` }}></div>
                          <span className="poll-votes">{votes} votes ({percentage.toFixed(0)}%)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="poll-footer">
                <span>{totalVotes} total votes</span>
              </div>
            </div>
          );
        })}
        {polls.length === 0 && (
          <p className="no-polls">No polls yet. {isHost && 'Create one!'}</p>
        )}
      </div>
    </div>
  );
};

export default PollsPanel;

