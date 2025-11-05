import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  HiPlus, 
  HiCheckCircle, 
  HiClock, 
  HiXCircle, 
  HiMagnifyingGlass,
  HiCalendar,
  HiListBullet,
  HiXMark,
  HiPencil,
  HiTrash,
  HiArrowLeft,
  HiArrowRight,
  HiArrowDownTray,
  HiTag,
  HiBell,
  HiArrowsUpDown,
  HiFunnel,
  HiSquares2X2,
  HiArrowPath,
  HiSparkles,
  HiExclamationTriangle
} from 'react-icons/hi2';
import './Tasks.css';

function Tasks() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [
      { id: 1, title: 'Review meeting recordings', status: 'todo', priority: 'high', dueDate: '2024-11-05', description: '', category: 'meeting', tags: ['important'], reminder: false },
      { id: 2, title: 'Prepare presentation slides', status: 'in-progress', priority: 'medium', dueDate: '2024-11-06', description: '', category: 'work', tags: [], reminder: true },
      { id: 3, title: 'Schedule team meeting', status: 'completed', priority: 'low', dueDate: '2024-11-04', description: '', category: 'meeting', tags: [], reminder: false },
      { id: 4, title: 'Update project documentation', status: 'todo', priority: 'high', dueDate: '2024-11-07', description: '', category: 'work', tags: ['documentation'], reminder: false },
      { id: 5, title: 'Follow up with clients', status: 'in-progress', priority: 'medium', dueDate: '2024-11-08', description: '', category: 'client', tags: [], reminder: true }
    ];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, priority, title, status
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    category: '',
    tags: [],
    reminder: false,
    reminderTime: ''
  });
  const [newTag, setNewTag] = useState('');

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Check for due date reminders
  useEffect(() => {
    const checkDueDates = () => {
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = tasks.filter(task => 
        task.dueDate < today && task.status !== 'completed'
      );
      const dueTodayTasks = tasks.filter(task => 
        task.dueDate === today && task.status !== 'completed'
      );
      
      if (overdueTasks.length > 0) {
        toast.warning(`You have ${overdueTasks.length} overdue task(s)`, { autoClose: 5000 });
      }
      if (dueTodayTasks.length > 0 && new Date().getHours() === 9) {
        toast.info(`You have ${dueTodayTasks.length} task(s) due today`, { autoClose: 5000 });
      }
    };

    checkDueDates();
    const interval = setInterval(checkDueDates, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  const getCategories = () => {
    const categories = new Set(tasks.map(t => t.category).filter(Boolean));
    return Array.from(categories);
  };

  const getAllTags = () => {
    const tags = new Set();
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
      const matchesDateRange = (!dateRange.start || task.dueDate >= dateRange.start) &&
                               (!dateRange.end || task.dueDate <= dateRange.end);
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          const statusOrder = { todo: 1, 'in-progress': 2, completed: 3 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusCount = (status) => {
    return tasks.filter(t => t.status === status).length;
  };

  const getPriorityCount = (priority) => {
    return tasks.filter(t => t.priority === priority && t.status !== 'completed').length;
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        if (task.status === 'completed') {
          return { ...task, status: 'todo' };
        } else if (task.status === 'todo') {
          return { ...task, status: 'in-progress' };
        } else {
          return { ...task, status: 'completed', completedAt: new Date().toISOString() };
        }
      }
      return task;
    }));
    toast.success('Task status updated');
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'todo',
      category: '',
      tags: [],
      reminder: false,
      reminderTime: ''
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category || '',
      tags: task.tags || [],
      reminder: task.reminder || false,
      reminderTime: task.reminderTime || ''
    });
    setShowModal(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast.error('Title and due date are required');
      return;
    }

    if (selectedTask) {
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, ...formData, updatedAt: new Date().toISOString() }
          : task
      ));
      toast.success('Task updated successfully');
    } else {
      const newTask = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
      toast.success('Task created successfully');
    }
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.length} task(s)?`)) {
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      toast.success(`${selectedTasks.length} task(s) deleted successfully`);
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedTasks.length === 0) return;
    setTasks(tasks.map(task => 
      selectedTasks.includes(task.id) 
        ? { ...task, status: newStatus }
        : task
    ));
    setSelectedTasks([]);
    toast.success(`${selectedTasks.length} task(s) updated successfully`);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleQuickAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const quickTask = {
      id: Date.now(),
      title: `Quick Task ${tasks.length + 1}`,
      description: '',
      dueDate: today,
      priority: 'medium',
      status: 'todo',
      category: '',
      tags: [],
      reminder: false,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, quickTask]);
    toast.success('Quick task created');
  };

  const exportTasks = () => {
    const csvData = filteredAndSortedTasks.map(task => ({
      Title: task.title,
      Description: task.description || '',
      Status: task.status,
      Priority: task.priority,
      'Due Date': task.dueDate,
      Category: task.category || '',
      Tags: (task.tags || []).join(', '),
      'Created At': task.createdAt || ''
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_export_${Date.now()}.csv`;
    a.click();
    toast.success('Tasks exported successfully');
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleCalendarDateClick = (date) => {
    if (!date) return;
    setFormData({
      ...formData,
      dueDate: date.toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
            <HiArrowLeft />
          </button>
          <div className="calendar-month-year">
            <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
            <button className="calendar-today-btn" onClick={goToToday}>Today</button>
          </div>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
            <HiArrowRight />
          </button>
        </div>

        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          
          {days.map((date, index) => {
            const dateTasks = getTasksForDate(date);
            const isToday = date && date.getTime() === today.getTime();
            const isPast = date && date < today && !isToday;
            
            return (
              <div 
                key={index} 
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
                onClick={() => handleCalendarDateClick(date)}
              >
                {date && (
                  <>
                    <div className="calendar-day-number">{date.getDate()}</div>
                    <div className="calendar-day-tasks">
                      {dateTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-task-dot ${task.priority} ${task.status}`}
                          title={task.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                        >
                          {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                        </div>
                      ))}
                      {dateTasks.length > 3 && (
                        <div className="calendar-task-more" onClick={(e) => e.stopPropagation()}>
                          +{dateTasks.length - 3} more
                        </div>
                      )}
                      {dateTasks.length === 0 && (
                        <div className="calendar-add-task-hint" onClick={(e) => e.stopPropagation()}>
                          <HiPlus /> Add task
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, overdue, completionRate };
  };

  const stats = getTaskStats();

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track your meeting-related tasks</p>
        </div>
        <div className="tasks-header-actions">
          <button className="btn-secondary" onClick={exportTasks}>
            <HiArrowDownTray />
            Export
          </button>
          <button className="btn-secondary" onClick={handleQuickAdd}>
            <HiSparkles />
            Quick Add
          </button>
          <button className="btn-primary" onClick={handleCreateTask}>
          <HiPlus />
          Add Task
        </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="tasks-stats">
        <div className="stat-card stat-todo">
          <div className="stat-icon">
            <HiClock />
          </div>
          <div className="stat-info">
          <div className="stat-value">{getStatusCount('todo')}</div>
          <div className="stat-label">To Do</div>
          </div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon">
            <HiArrowPath />
          </div>
          <div className="stat-info">
          <div className="stat-value">{getStatusCount('in-progress')}</div>
          <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon">
            <HiCheckCircle />
          </div>
          <div className="stat-info">
          <div className="stat-value">{getStatusCount('completed')}</div>
          <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <HiSquares2X2 />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
            <div className="stat-subtext">{stats.completionRate}% Complete</div>
          </div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card stat-overdue">
            <div className="stat-icon">
              <HiExclamationTriangle />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Stats */}
      <div className="priority-stats">
        <div className="priority-stat-item priority-high">
          <span className="priority-stat-label">High Priority</span>
          <span className="priority-stat-value">{getPriorityCount('high')}</span>
        </div>
        <div className="priority-stat-item priority-medium">
          <span className="priority-stat-label">Medium Priority</span>
          <span className="priority-stat-value">{getPriorityCount('medium')}</span>
        </div>
        <div className="priority-stat-item priority-low">
          <span className="priority-stat-label">Low Priority</span>
          <span className="priority-stat-value">{getPriorityCount('low')}</span>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="tasks-controls">
        <div className="search-box">
          <HiMagnifyingGlass className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="tasks-controls-right">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <HiFunnel />
            Filters
          </button>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <HiListBullet />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <HiCalendar />
            </button>
          </div>
          <div className="sort-controls">
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <HiArrowsUpDown />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'todo' ? 'active' : ''}`}
            onClick={() => setFilterStatus('todo')}
          >
            To Do
          </button>
          <button
            className={`filter-btn ${filterStatus === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilterStatus('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
        </div>
      </div>
          <div className="filter-group">
            <label>Priority</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPriority('all')}
              >
                All
              </button>
              <button
                className={`filter-btn priority-high ${filterPriority === 'high' ? 'active' : ''}`}
                onClick={() => setFilterPriority('high')}
              >
                High
              </button>
              <button
                className={`filter-btn priority-medium ${filterPriority === 'medium' ? 'active' : ''}`}
                onClick={() => setFilterPriority('medium')}
              >
                Medium
              </button>
              <button
                className={`filter-btn priority-low ${filterPriority === 'low' ? 'active' : ''}`}
                onClick={() => setFilterPriority('low')}
              >
                Low
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select 
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range-inputs">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                placeholder="Start Date"
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                placeholder="End Date"
                className="date-input"
              />
              {(dateRange.start || dateRange.end) && (
                <button 
                  className="clear-filter-btn"
                  onClick={() => setDateRange({ start: '', end: '' })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-actions-count">{selectedTasks.length} task(s) selected</span>
          <div className="bulk-actions-buttons">
            <button className="bulk-action-btn" onClick={() => handleBulkStatusChange('todo')}>
              Mark as To Do
            </button>
            <button className="bulk-action-btn" onClick={() => handleBulkStatusChange('in-progress')}>
              Mark as In Progress
            </button>
            <button className="bulk-action-btn" onClick={() => handleBulkStatusChange('completed')}>
              Mark as Completed
            </button>
            <button className="bulk-action-btn bulk-action-delete" onClick={handleBulkDelete}>
              <HiTrash />
              Delete
            </button>
            <button className="bulk-action-btn" onClick={() => setSelectedTasks([])}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
      <div className="tasks-list">
          {filteredAndSortedTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
            return (
              <div 
                key={task.id} 
                className={`task-item ${task.status} ${isOverdue ? 'overdue' : ''}`}
              >
                <input
                  type="checkbox"
                  className="task-select-checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                />
            <button
              className="task-checkbox"
              onClick={() => toggleTaskStatus(task.id)}
            >
              {task.status === 'completed' ? (
                <HiCheckCircle className="checked" />
              ) : task.status === 'in-progress' ? (
                <HiClock className="in-progress" />
              ) : (
                <HiXCircle className="todo" />
              )}
            </button>
            <div className="task-content">
                  <div className="task-header-row">
              <h3 className="task-title">{task.title}</h3>
                    {task.reminder && (
                      <HiBell className="task-reminder-icon" title="Reminder set" />
                    )}
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
              <div className="task-meta">
                <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                    {task.category && (
                      <span className="category-badge">
                        <HiTag />
                        {task.category}
                      </span>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="task-tags">
                        {task.tags.map(tag => (
                          <span key={tag} className="tag-badge">{tag}</span>
                        ))}
                      </div>
                    )}
                {task.dueDate && (
                      <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue && <HiExclamationTriangle className="overdue-icon" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="task-action-btn" onClick={() => handleEditTask(task)} title="Edit">
                    <HiPencil />
                  </button>
                  <button className="task-action-btn task-action-delete" onClick={() => handleDeleteTask(task.id)} title="Delete">
                    <HiTrash />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredAndSortedTasks.length === 0 && (
            <div className="no-tasks">
              <HiCalendar className="no-tasks-icon" />
              <p>No tasks found</p>
              <p className="no-tasks-subtext">Try adjusting your filters or create a new task</p>
              <button className="btn-primary" onClick={handleCreateTask}>
                <HiPlus />
                Create Your First Task
              </button>
            </div>
          )}
        </div>
      ) : (
        renderCalendar()
      )}

      {/* Enhanced Create/Edit Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiXMark />
              </button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description (optional)"
                  rows="4"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
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
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., meeting, work, personal"
                    list="categories"
                  />
                  <datalist id="categories">
                    {getCategories().map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Reminder</label>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={formData.reminder}
                      onChange={(e) => setFormData({ ...formData, reminder: e.target.checked })}
                    />
                    <span>Set reminder</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input-container">
                  <div className="tags-display">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag-badge-input">
                        {tag}
                        <button 
                          type="button"
                          className="tag-remove-btn"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <HiXMark />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="tag-input-row">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag and press Enter"
                      className="tag-input"
                    />
                    <button type="button" className="tag-add-btn" onClick={handleAddTag}>
                      <HiPlus />
                    </button>
          </div>
                  <div className="suggested-tags">
                    {getAllTags().filter(tag => !formData.tags.includes(tag)).slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="suggested-tag-btn"
                        onClick={() => {
                          if (!formData.tags.includes(tag)) {
                            setFormData({ ...formData, tags: [...formData.tags, tag] });
                          }
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
          </div>
        )}
    </div>
  );
}

export default Tasks;
