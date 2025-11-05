/**
 * Subscription Feature Utilities
 * Helper functions to check subscription features and limitations
 */

/**
 * Check if a feature is available for a plan
 * @param {string} planId - The plan ID (free, basic, pro, yearly)
 * @param {string} feature - The feature to check
 * @returns {boolean}
 */
export const hasFeature = (planId, feature) => {
  const featureMap = {
    free: {
      recording: false,
      cloudRecording: false,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      calendarIntegration: false,
      liveStreaming: false,
      breakoutRooms: false,
      meetingAnalytics: false,
      apiAccess: false,
      advertising: true
    },
    basic: {
      recording: true,
      cloudRecording: false,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      calendarIntegration: false,
      liveStreaming: false,
      breakoutRooms: false,
      meetingAnalytics: false,
      apiAccess: false,
      advertising: false
    },
    pro: {
      recording: true,
      cloudRecording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      calendarIntegration: true,
      liveStreaming: true,
      breakoutRooms: true,
      meetingAnalytics: true,
      apiAccess: true,
      advertising: false
    },
    yearly: {
      recording: true,
      cloudRecording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      calendarIntegration: true,
      liveStreaming: true,
      breakoutRooms: true,
      meetingAnalytics: true,
      apiAccess: true,
      advertising: false
    }
  };

  const planFeatures = featureMap[planId] || featureMap.free;
  return planFeatures[feature] === true;
};

/**
 * Get call minutes limit for a plan
 * @param {string} planId - The plan ID
 * @returns {number} - Call minutes (-1 for unlimited)
 */
export const getCallMinutesLimit = (planId) => {
  const limits = {
    free: 120, // 2 hours
    basic: 600, // 10 hours
    pro: -1, // unlimited
    yearly: -1 // unlimited
  };
  return limits[planId] || limits.free;
};

/**
 * Check if plan has unlimited call minutes
 * @param {string} planId - The plan ID
 * @returns {boolean}
 */
export const hasUnlimitedMinutes = (planId) => {
  return getCallMinutesLimit(planId) === -1;
};

/**
 * Get plan limitations
 * @param {string} planId - The plan ID
 * @returns {object}
 */
export const getPlanLimitations = (planId) => {
  const limitations = {
    free: {
      maxCallMinutes: 120,
      maxMeetingsPerMonth: 10,
      recording: false,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      apiAccess: false,
      advertising: true
    },
    basic: {
      maxCallMinutes: 600,
      maxMeetingsPerMonth: 50,
      recording: true,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      apiAccess: false,
      advertising: false
    },
    pro: {
      maxCallMinutes: -1, // unlimited
      maxMeetingsPerMonth: -1, // unlimited
      recording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      apiAccess: true,
      advertising: false
    },
    yearly: {
      maxCallMinutes: -1, // unlimited
      maxMeetingsPerMonth: -1, // unlimited
      recording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      apiAccess: true,
      advertising: false
    }
  };

  return limitations[planId] || limitations.free;
};

/**
 * Check if user can perform action based on subscription
 * @param {object} subscription - User subscription object
 * @param {string} action - Action to check
 * @returns {boolean}
 */
export const canPerformAction = (subscription, action) => {
  if (!subscription || !subscription.features) {
    return false;
  }

  switch (action) {
    case 'record':
      return subscription.features.recording === true;
    case 'recordCloud':
      return subscription.features.cloudRecording === true;
    case 'customBranding':
      return subscription.features.customBranding === true;
    case 'apiAccess':
      return subscription.features.apiAccess === true;
    case 'calendarIntegration':
      return subscription.features.calendarIntegration === true;
    case 'liveStreaming':
      return subscription.features.liveStreaming === true;
    case 'breakoutRooms':
      return subscription.features.breakoutRooms === true;
    case 'meetingAnalytics':
      return subscription.features.meetingAnalytics === true;
    case 'advancedFeatures':
      return subscription.features.advancedFeatures === true;
    default:
      return true;
  }
};

/**
 * Format feature name for display
 * @param {string} feature - Feature key
 * @returns {string}
 */
export const formatFeatureName = (feature) => {
  return feature
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

