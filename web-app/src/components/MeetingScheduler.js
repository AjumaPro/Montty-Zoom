import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { HiXMark, HiCalendar, HiClock, HiLockClosed, HiUsers, HiBell, HiArrowPath, HiChevronDown } from 'react-icons/hi2';
import { getTeamMembers } from '../utils/teamStorage';
import './MeetingScheduler.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MeetingScheduler({ isOpen, onClose, onMeetingCreated, meeting }) {
  const getInitialFormData = () => ({
    title: meeting?.title || '',
    description: meeting?.description || '',
    scheduledDate: meeting?.scheduledDate || '',
    scheduledTime: meeting?.scheduledTime || '',
    duration: meeting?.duration || 60,
    roomPassword: meeting?.roomPassword || '',
    reminderTime: meeting?.reminderTime || null,
    participants: meeting?.participants || [],
    isRecurring: meeting?.isRecurring || false,
    recurrencePattern: meeting?.recurrencePattern || 'none',
    recurrenceEndDate: meeting?.recurrenceEndDate || '',
    recurrenceCount: meeting?.recurrenceCount || null
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');

  const checkCalendarConnection = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      const response = await axios.get(`${API_URL}/api/calendar/status`, {
        params: { userId }
      });
      setCalendarConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      setCalendarConnected(false);
    }
  };

  const loadTeamMembers = () => {
    const members = getTeamMembers();
    setTeamMembers(members);
  };

  // Reset form when meeting prop changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError('');
      setParticipantEmail('');
      setSelectedTeamMember('');
      setShowTeamDropdown(false);
      checkCalendarConnection();
      loadTeamMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, meeting?.id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    });
    setError('');
  };

  const addParticipant = () => {
    const email = participantEmail.trim();
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Check if participant already exists
      const exists = formData.participants.some(p => 
        (typeof p === 'string' ? p : p.email) === email
      );
      
      if (exists) {
        toast.warning('Participant already added');
        return;
      }

      setFormData({
        ...formData,
        participants: [...formData.participants, email]
      });
      setParticipantEmail('');
    }
  };

  const addTeamMemberAsParticipant = (member) => {
    const email = member.email;
    
    // Check if participant already exists
    const exists = formData.participants.some(p => 
      (typeof p === 'string' ? p : p.email) === email
    );
    
    if (exists) {
      toast.warning('Participant already added');
      return;
    }

    // Add participant with name and email
    setFormData({
      ...formData,
      participants: [...formData.participants, { name: member.name, email: member.email }]
    });
    setSelectedTeamMember('');
    setShowTeamDropdown(false);
    toast.success(`${member.name} added to participants`);
  };

  const removeParticipant = (emailOrObj) => {
    const email = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj.email;
    setFormData({
      ...formData,
      participants: formData.participants.filter(p => {
        const participantEmail = typeof p === 'string' ? p : p.email;
        return participantEmail !== email;
      })
    });
  };

  const getParticipantDisplay = (participant) => {
    if (typeof participant === 'string') {
      return { email: participant, name: participant };
    }
    return participant;
  };

  const getParticipantEmail = (participant) => {
    return typeof participant === 'string' ? participant : participant.email;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a meeting title');
      return;
    }
    
    if (!formData.scheduledDate) {
      setError('Please select a date');
      return;
    }
    
    if (!formData.scheduledTime) {
      setError('Please select a time');
      return;
    }

    // Convert duration to number if it's a string
    // Also normalize participants to email strings for backend compatibility
    const normalizedParticipants = formData.participants.map(p => 
      typeof p === 'string' ? p : p.email
    );

    const submitData = {
      ...formData,
      participants: normalizedParticipants,
      duration: parseInt(formData.duration) || 60,
      reminderTime: formData.reminderTime ? parseInt(formData.reminderTime) : null,
      recurrenceCount: formData.recurrenceCount ? parseInt(formData.recurrenceCount) : null
    };

    // Remove recurrence fields if not recurring
    if (!submitData.isRecurring) {
      submitData.recurrencePattern = 'none';
      submitData.recurrenceEndDate = '';
      submitData.recurrenceCount = null;
    }

    setLoading(true);
    try {
      let savedMeeting;
      if (meeting?.id) {
        // Update existing meeting
        const response = await axios.put(`${API_URL}/api/meetings/${meeting.id}`, submitData);
        savedMeeting = response.data;
        toast.success('Meeting updated successfully!');
      } else {
        // Create new meeting
        const response = await axios.post(`${API_URL}/api/meetings/schedule`, submitData);
        savedMeeting = response.data;
        toast.success('Meeting scheduled successfully!');
      }

      // Sync to calendar if connected and enabled
      if (syncToCalendar && calendarConnected && savedMeeting) {
        try {
          const userId = localStorage.getItem('userId') || 'default-user';
          const startDateTime = new Date(`${submitData.scheduledDate}T${submitData.scheduledTime}`);
          const endDateTime = new Date(startDateTime.getTime() + (submitData.duration || 60) * 60000);

          // Extract email addresses from participants (handle both string and object formats)
          const attendeeEmails = (submitData.participants || []).map(p => 
            typeof p === 'string' ? p : p.email
          );

          const calendarEvent = {
            userId,
            title: submitData.title,
            description: submitData.description || '',
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            location: '',
            attendees: attendeeEmails,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            reminders: submitData.reminderTime ? [
              { method: 'email', minutes: submitData.reminderTime },
              { method: 'popup', minutes: submitData.reminderTime }
            ] : undefined
          };

          if (meeting?.id && meeting.calendarEventId) {
            // Update existing calendar event
            await axios.put(`${API_URL}/api/calendar/events/${meeting.calendarEventId}`, calendarEvent);
            toast.info('Calendar event updated');
          } else {
            // Create new calendar event
            const calendarResponse = await axios.post(`${API_URL}/api/calendar/events`, calendarEvent);
            toast.info('Meeting added to calendar');
            // Optionally save calendarEventId to meeting
            if (calendarResponse.data.event?.id) {
              await axios.put(`${API_URL}/api/meetings/${savedMeeting.id}`, {
                calendarEventId: calendarResponse.data.event.id
              });
            }
          }
        } catch (calendarError) {
          console.error('Error syncing to calendar:', calendarError);
          toast.warning('Meeting saved, but failed to sync to calendar');
        }
      }

      onMeetingCreated();
      onClose();
    } catch (err) {
      console.error('Meeting save error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save meeting. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="scheduler-overlay" onClick={onClose}>
      <div className="scheduler-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scheduler-header">
          <h2>{meeting?.id ? 'Edit Meeting' : 'Schedule New Meeting'}</h2>
          <button className="scheduler-close-btn" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scheduler-form">
          {error && <div className="scheduler-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">
              Meeting Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add meeting description (optional)"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduledDate">
                <HiCalendar className="label-icon" /> Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={today}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="scheduledTime">
                <HiClock className="label-icon" /> Time <span className="required">*</span>
              </label>
              <input
                type="time"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reminderTime">
                <HiBell className="label-icon" /> Reminder
              </label>
              <select
                id="reminderTime"
                name="reminderTime"
                value={formData.reminderTime || ''}
                onChange={(e) => handleChange({ target: { name: 'reminderTime', value: e.target.value || null } })}
              >
                <option value="">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="roomPassword">
              <HiLockClosed className="label-icon" /> Room Password (optional)
            </label>
            <input
              type="password"
              id="roomPassword"
              name="roomPassword"
              value={formData.roomPassword}
              onChange={handleChange}
              placeholder="Optional password for the meeting room"
            />
          </div>

          <div className="form-group">
            <label htmlFor="participants">
              <HiUsers className="label-icon" /> Participants (optional)
            </label>
            
            {/* Team Member Selection */}
            <div className="participant-selection-tabs">
              <div className="participant-tab-selector">
                <div className="participant-tab-options">
                  <div className="team-member-select-wrapper">
                    <select
                      value={selectedTeamMember}
                      onChange={(e) => {
                        const memberId = e.target.value;
                        if (memberId) {
                          const member = teamMembers.find(m => m.id === parseInt(memberId));
                          if (member) {
                            addTeamMemberAsParticipant(member);
                          }
                        }
                      }}
                      className="team-member-select"
                      onFocus={() => setShowTeamDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTeamDropdown(false), 200)}
                    >
                      <option value="">Select from Team</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                    <HiChevronDown className="select-chevron" />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="participant-input">
              <input
                type="email"
                id="participants"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                placeholder="Or enter email address and press Enter"
              />
              <button type="button" onClick={addParticipant} className="add-participant-btn">
                Add
              </button>
            </div>

            {/* Participants List */}
            {formData.participants.length > 0 && (
              <div className="participants-list">
                {formData.participants.map((participant, idx) => {
                  const display = getParticipantDisplay(participant);
                  const email = getParticipantEmail(participant);
                  return (
                    <span key={idx} className="participant-tag">
                      {display.name && display.name !== display.email ? (
                        <>
                          <span className="participant-name">{display.name}</span>
                          <span className="participant-email">{email}</span>
                        </>
                      ) : (
                        <span>{email}</span>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeParticipant(participant)} 
                        className="remove-participant"
                        title="Remove participant"
                      >
                        <HiXMark />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="checkbox-input"
              />
              <HiArrowPath className="label-icon" /> Recurring Meeting
            </label>
            {formData.isRecurring && (
              <div className="recurrence-options">
                <select
                  name="recurrencePattern"
                  value={formData.recurrencePattern}
                  onChange={handleChange}
                  className="recurrence-select"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div className="recurrence-end">
                  <label>End Date (optional):</label>
                  <input
                    type="date"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    min={formData.scheduledDate || today}
                  />
                </div>
                <div className="recurrence-end">
                  <label>Or after number of occurrences:</label>
                  <input
                    type="number"
                    name="recurrenceCount"
                    value={formData.recurrenceCount || ''}
                    onChange={(e) => setFormData({ ...formData, recurrenceCount: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 10"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          {calendarConnected && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="checkbox-input"
                />
                <HiCalendar className="label-icon" /> Sync to Calendar
              </label>
              <p className="checkbox-description">Add this meeting to your connected calendar</p>
            </div>
          )}

          <div className="scheduler-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : (meeting?.id ? 'Update Meeting' : 'Schedule Meeting')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MeetingScheduler;

