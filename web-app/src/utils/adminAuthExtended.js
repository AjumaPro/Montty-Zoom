// Additional admin API helper functions for comprehensive features

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getDetailedSubscriptions = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/subscriptions/detailed`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return { subscriptions: [], totalRevenue: 0 };
  } catch (error) {
    console.error('Error fetching detailed subscriptions:', error);
    return { subscriptions: [], totalRevenue: 0 };
  }
};

export const getActivityLogs = async (filters = {}) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await fetch(`${API_URL}/api/admin/activity-logs?${params.toString()}`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};

export const getPayments = async (limit = 1000) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/payments?limit=${limit}`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const createPayment = async (paymentData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(paymentData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating payment:', error);
    return null;
  }
};

export const getRevenueReport = async (startDate, endDate) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`${API_URL}/api/admin/reports/revenue?${params.toString()}`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    return [];
  }
};

export const getUserReport = async (startDate, endDate) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`${API_URL}/api/admin/reports/users?${params.toString()}`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error fetching user report:', error);
    return null;
  }
};

export const getSystemHealth = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/system/health`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error fetching system health:', error);
    return null;
  }
};

export const getEmailTemplates = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/email-templates`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
};

export const createEmailTemplate = async (templateData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/email-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(templateData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating email template:', error);
    return null;
  }
};

export const sendTestEmail = async (templateId, email) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({
        templateId,
        to: email,
        test: true
      }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error sending test email:', error);
    return null;
  }
};

export const sendEmail = async (emailData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(emailData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
};

export const getContentItems = async (type = null) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const url = type 
      ? `${API_URL}/api/admin/content?type=${type}`
      : `${API_URL}/api/admin/content`;
    const response = await fetch(url, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
};

export const createContentItem = async (contentData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(contentData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating content:', error);
    return null;
  }
};

export const getFeatureFlags = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/feature-flags`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }
};

export const createFeatureFlag = async (flagData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/feature-flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(flagData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return null;
  }
};

export const getApiKeys = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/api-keys`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }
};

export const createApiKey = async (keyData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(keyData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating API key:', error);
    return null;
  }
};

export const getSupportTickets = async (status = null) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const url = status 
      ? `${API_URL}/api/admin/support-tickets?status=${status}`
      : `${API_URL}/api/admin/support-tickets`;
    const response = await fetch(url, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
};

export const addTicketMessage = async (ticketId, message) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/support-tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ message }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error adding ticket message:', error);
    return null;
  }
};

export const updateSupportTicket = async (ticketId, updates) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/support-tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
};

export const createBackup = async (backupType = 'full') => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/backup/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ backupType }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
};

export const getBackups = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/backup/list`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching backups:', error);
    return [];
  }
};

export const getSystemSettings = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/settings`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

export const updateSystemSetting = async (key, value, type, category, description) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ value, type, category, description }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error updating setting:', error);
    return null;
  }
};

export const bulkUserAction = async (userIds, action, data = {}) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/bulk/users/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ userIds, action, data }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return null;
  }
};

export const bulkSendEmail = async (userIds, subject, body) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/bulk/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ userIds, subject, body }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return null;
  }
};

export const getAdvancedAnalytics = async (startDate, endDate) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`${API_URL}/api/admin/analytics/advanced?${params.toString()}`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    return null;
  }
};

export const getRoles = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/roles`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

export const createRole = async (roleData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(roleData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating role:', error);
    return null;
  }
};

export const assignRole = async (userId, roleId) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/roles/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify({ userId, roleId }),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error assigning role:', error);
    return null;
  }
};

// Export CSV helper
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || `export_${Date.now()}.csv`;
  link.click();
};

// Customer Call Center & Service functions
export const getCallCenterStats = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/call-center/stats`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error fetching call center stats:', error);
    return null;
  }
};

export const getCallCenterAgents = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/call-center/agents`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching call center agents:', error);
    return [];
  }
};

export const createCallCenterAgent = async (agentData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/call-center/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(agentData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating call center agent:', error);
    return null;
  }
};

export const getCustomerServiceCalls = async (status = null) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const url = status 
      ? `${API_URL}/api/admin/customer-service/calls?status=${status}`
      : `${API_URL}/api/admin/customer-service/calls`;
    const response = await fetch(url, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return [];
  } catch (error) {
    console.error('Error fetching customer service calls:', error);
    return [];
  }
};

export const createCustomerServiceCall = async (callData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/customer-service/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(callData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating customer service call:', error);
    return null;
  }
};

export const updateCustomerServiceCall = async (callId, updates) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/customer-service/calls/${callId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error updating customer service call:', error);
    return null;
  }
};

export const getCustomerExperience = async () => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/customer-service/experience`, {
      headers: { 'user-email': userEmail },
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return { experiences: [], metrics: {} };
  } catch (error) {
    console.error('Error fetching customer experience:', error);
    return { experiences: [], metrics: {} };
  }
};

export const createCustomerExperience = async (experienceData) => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/api/admin/customer-service/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-email': userEmail
      },
      body: JSON.stringify(experienceData),
      credentials: 'include'
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error creating customer experience:', error);
    return null;
  }
};


