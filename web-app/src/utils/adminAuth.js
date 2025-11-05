/**
 * Super Admin Authentication Utilities
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Super admin email (should be in environment variable in production)
const SUPER_ADMIN_EMAIL = process.env.REACT_APP_SUPER_ADMIN_EMAIL || 'infoajumapro@gmail.com';

export const isSuperAdmin = () => {
  const userEmail = localStorage.getItem('userEmail');
  return userEmail === SUPER_ADMIN_EMAIL;
};

export const checkSuperAdmin = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return false;

    const response = await fetch(`${API_URL}/api/admin/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getAdminStats = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/stats`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getAllSubscriptions = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/subscriptions`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
};

export const getAllRooms = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/rooms`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

export const deleteUser = async (userId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const updateUser = async (userId, data) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const getMeetingHistory = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/meetings/history`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching meeting history:', error);
    return [];
  }
};

export const deleteMeeting = async (meetingId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return false;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting room:', error);
    return false;
  }
};

export const getAllProjects = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/projects`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const createProject = async (projectData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};

export const getAllReminders = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/reminders`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
};

export const createReminder = async (reminderData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(reminderData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error creating reminder:', error);
    return null;
  }
};

export const updateReminder = async (reminderId, reminderData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/reminders/${reminderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(reminderData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error updating reminder:', error);
    return null;
  }
};

export const deleteReminder = async (reminderId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return false;
  }
};

export const getAnalytics = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/analytics`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};

export const getPendingUsers = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/pending`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
};

export const approveUser = async (userId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error approving user:', error);
    return null;
  }
};

export const rejectUser = async (userId, reason = '') => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ reason }),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error rejecting user:', error);
    return null;
  }
};

export const suspendUser = async (userId, reason = '') => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ reason }),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error suspending user:', error);
    return null;
  }
};

export const unsuspendUser = async (userId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/unsuspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error unsuspending user:', error);
    return null;
  }
};

export const grantPremiumSubscription = async (userId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/grant-premium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error granting premium subscription:', error);
    return null;
  }
};

export const getPackages = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/packages`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
};

export const getPackage = async (planId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/packages/${planId}`, {
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching package:', error);
    return null;
  }
};

export const createPackage = async (packageData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(packageData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create package');
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
};

export const updatePackage = async (planId, packageData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/packages/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(packageData),
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update package');
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

export const deletePackage = async (planId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/packages/${planId}`, {
      method: 'DELETE',
      headers: {
        'user-email': userEmail
      },
      credentials: 'include'
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error deleting package:', error);
    return null;
  }
};

