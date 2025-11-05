/**
 * Pricing Plans Configuration
 * Defines all subscription tiers and their features
 */

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'monthly',
    description: 'Perfect for trying out Montty Zoom',
    features: [
      '2 hours of call minutes per month',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Google advertising included',
      'Basic meeting features'
    ],
    limitations: {
      maxParticipants: -1, // unlimited
      maxCallMinutes: 120, // 2 hours in minutes
      maxMeetingsPerMonth: 10,
      recording: false,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      apiAccess: false
    },
    callMinutes: 120,
    popular: false
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 1.99,
    billing: 'monthly',
    description: 'For individuals and small teams',
    features: [
      '10 hours of call minutes per month',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Recording (local)',
      'No advertising',
      'Email support',
      'Meeting scheduling'
    ],
    limitations: {
      maxParticipants: -1, // unlimited
      maxCallMinutes: 600, // 10 hours
      maxMeetingsPerMonth: 50,
      recording: true,
      customBranding: false,
      prioritySupport: false,
      advancedFeatures: false,
      apiAccess: false
    },
    callMinutes: 600,
    popular: false
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    billing: 'monthly',
    description: 'For large organizations with all features',
    features: [
      'Unlimited call minutes',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Cloud recording',
      'Custom branding',
      'Priority support',
      'Advanced features',
      'Calendar integration',
      'Live streaming',
      'Breakout rooms',
      'Meeting analytics',
      'Get every new update',
      'API access'
    ],
    limitations: {
      maxParticipants: -1, // unlimited
      maxCallMinutes: -1, // unlimited
      maxMeetingsPerMonth: -1, // unlimited
      recording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      apiAccess: true
    },
    callMinutes: -1, // unlimited
    popular: true
  },
  YEARLY: {
    id: 'yearly',
    name: 'Yearly',
    price: 50,
    billing: 'yearly',
    description: 'Best value - Save 17% compared to monthly',
    features: [
      'Unlimited call minutes',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Cloud recording',
      'Custom branding',
      'Priority support',
      'Advanced features',
      'Calendar integration',
      'Live streaming',
      'Breakout rooms',
      'Meeting analytics',
      'Get every new update',
      'API access',
      'Same as Pro plan'
    ],
    limitations: {
      maxParticipants: -1, // unlimited
      maxCallMinutes: -1, // unlimited
      maxMeetingsPerMonth: -1, // unlimited
      recording: true,
      customBranding: true,
      prioritySupport: true,
      advancedFeatures: true,
      apiAccess: true
    },
    callMinutes: -1, // unlimited
    monthlyEquivalent: 4.17, // $50 / 12 months
    popular: false
  }
};

export const PLAN_FEATURES_COMPARISON = [
  {
    feature: 'Call Minutes per Month',
    free: '2 hours',
    basic: '10 hours',
    pro: 'Unlimited',
    yearly: 'Unlimited'
  },
  {
    feature: 'Max Participants',
    free: 'Unlimited',
    basic: 'Unlimited',
    pro: 'Unlimited',
    yearly: 'Unlimited'
  },
  {
    feature: 'Video Quality',
    free: 'HD',
    basic: 'HD',
    pro: 'HD',
    yearly: 'HD'
  },
  {
    feature: 'Screen Sharing',
    free: '✓',
    basic: '✓',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Chat Messaging',
    free: '✓',
    basic: '✓',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Recording',
    free: '✗',
    basic: 'Local',
    pro: 'Cloud',
    yearly: 'Cloud'
  },
  {
    feature: 'Custom Branding',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Calendar Integration',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Live Streaming',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Breakout Rooms',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Meeting Analytics',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'API Access',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Support',
    free: 'Community',
    basic: 'Email',
    pro: 'Priority',
    yearly: 'Priority'
  },
  {
    feature: 'Get New Updates',
    free: '✗',
    basic: '✗',
    pro: '✓',
    yearly: '✓'
  },
  {
    feature: 'Advertising',
    free: 'Google Ads',
    basic: 'No ads',
    pro: 'No ads',
    yearly: 'No ads'
  }
];

// Helper functions
export const getPlanById = (planId) => {
  return Object.values(PLANS).find(plan => plan.id === planId) || PLANS.FREE;
};

export const formatPrice = (price, billing = 'monthly') => {
  if (price === 0) return 'Free';
  return billing === 'yearly' 
    ? `$${price}/year` 
    : `$${price}/month`;
};

export const calculateYearlySavings = (monthlyPrice) => {
  const yearlyPrice = monthlyPrice * 12;
  return yearlyPrice - 50; // Save compared to $50 yearly plan
};

export const isFeatureIncluded = (planId, feature) => {
  const plan = getPlanById(planId);
  return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
};

