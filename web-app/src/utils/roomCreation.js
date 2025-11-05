/**
 * Room Creation Utility
 * Handles room creation with subscription checks
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const createRoom = async (password = null) => {
  try {
    const userId = localStorage.getItem('userId');
    
    // Check subscription before creating room
    if (userId) {
      const checkResponse = await fetch(`${API_URL}/api/subscription/check-minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, requiredMinutes: 0 })
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        if (!checkResult.allowed) {
          throw new Error(checkResult.message || 'Insufficient call minutes. Please upgrade your plan.');
        }
      }
    }

    // Create room
    const response = await fetch(`${API_URL}/api/room/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        password,
        userId: userId || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.upgradeRequired) {
        throw new Error('UPGRADE_REQUIRED');
      }
      throw new Error(errorData.error || 'Failed to create room');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const checkFeatureBeforeAction = async (action, featureName, planName = 'Pro') => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    throw new Error('Please sign in to use this feature');
  }

  try {
    const response = await fetch(`${API_URL}/api/subscription/check-feature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, action })
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.allowed) {
        throw new Error(`FEATURE_LOCKED:${featureName}:${planName}`);
      }
      return true;
    }
    throw new Error('Failed to check feature');
  } catch (error) {
    console.error('Error checking feature:', error);
    throw error;
  }
};

