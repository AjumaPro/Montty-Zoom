/**
 * Subscription Feature Enforcement Hook
 * Checks subscription features before allowing actions
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { canPerformAction, getPlanLimitations } from '../utils/subscriptionFeatures';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSubscriptionFeatures = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/subscription?userId=${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else if (response.status === 404) {
        // No subscription found - this is OK, user will get free plan
        setSubscription(null);
      }
      // Silently handle other errors - don't show toast for non-critical subscription checks
    } catch (error) {
      // Network errors are OK - subscription checks aren't critical for dashboard display
      console.log('Subscription check failed (network error):', error.message);
      // Don't set subscription to avoid blocking UI
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const checkFeature = async (action) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return false;
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
        return data.allowed === true;
      }
      return false;
    } catch (error) {
      // Network errors - fail silently, assume feature not available
      console.log('Feature check failed (network error):', error.message);
      return false;
    }
  };

  const checkMinutes = async (requiredMinutes = 0) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return { allowed: false, remaining: 0 };
    }

    try {
      const response = await fetch(`${API_URL}/api/subscription/check-minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, requiredMinutes })
      });

      if (response.ok) {
        return await response.json();
      }
      return { allowed: false, remaining: 0 };
    } catch (error) {
      // Network errors - allow by default to avoid blocking meetings
      console.log('Minutes check failed (network error):', error.message);
      return { allowed: true, remaining: -1 };
    }
  };

  const trackMinutes = async (minutes) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return { allowed: true, remaining: -1 };

    try {
      const response = await fetch(`${API_URL}/api/subscription/track-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, minutes })
      });

      if (response.ok) {
        return await response.json();
      }
      return { allowed: true, remaining: -1 };
    } catch (error) {
      // Network errors - don't block usage tracking
      console.log('Usage tracking failed (network error):', error.message);
      return { allowed: true, remaining: -1 };
    }
  };

  const canPerform = (action) => {
    if (!subscription) return false;
    return canPerformAction(subscription, action);
  };

  const requireFeature = (action, featureName, planName = 'Pro') => {
    if (!canPerform(action)) {
      toast.error(`${featureName} is only available in the ${planName} plan.`);
      setTimeout(() => {
        navigate('/pricing');
      }, 2000);
      return false;
    }
    return true;
  };

  const requireMinutes = async (requiredMinutes, actionName = 'this action') => {
    const checkResult = await checkMinutes(requiredMinutes);
    if (!checkResult.allowed) {
      toast.error(`Insufficient call minutes. ${checkResult.message || 'Please upgrade your plan.'}`);
      setTimeout(() => {
        navigate('/pricing');
      }, 2000);
      return false;
    }
    return true;
  };

  return {
    subscription,
    loading,
    canPerform,
    checkFeature,
    checkMinutes,
    trackMinutes,
    requireFeature,
    requireMinutes,
    reloadSubscription: loadSubscription
  };
};

