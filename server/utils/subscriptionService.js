/**
 * Subscription Service
 * Handles subscription management, payment processing, and usage tracking
 */

const logger = require('./logger');
const db = require('./database');

class SubscriptionService {
  constructor() {
    this.subscriptions = new Map(); // In-memory fallback
    this.usageTracking = new Map(); // Track call minutes per user
  }

  // Check if user has an active subscription
  async hasSubscription(userId) {
    try {
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        const result = await db.db.query(
          'SELECT COUNT(*) FROM user_subscriptions WHERE user_id = $1 AND status = $2',
          [userId, 'active']
        );
        return parseInt(result.rows[0].count) > 0;
      }
      return this.subscriptions.has(userId);
    } catch (error) {
      logger.error('Error checking subscription:', error);
      return false;
    }
  }

  // Get user's current subscription
  async getUserSubscription(userId) {
    try {
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        const result = await db.db.query(
          'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = $2',
          [userId, 'active']
        );
        return result.rows[0] || this.getDefaultSubscription(userId);
      }
      return this.subscriptions.get(userId) || this.getDefaultSubscription(userId);
    } catch (error) {
      logger.error('Error getting user subscription:', error);
      return this.getDefaultSubscription(userId);
    }
  }

  // Get default free subscription
  getDefaultSubscription(userId) {
    return {
      userId,
      planId: 'free',
      planName: 'Free',
      status: 'active',
      billingCycle: 'monthly',
      callMinutes: 120, // 2 hours
      callMinutesUsed: 0,
      callMinutesRemaining: 120,
      maxParticipants: -1, // unlimited
      features: {
        recording: false, // Free plan has no recording
        cloudRecording: false,
        customBranding: false,
        prioritySupport: false,
        advancedFeatures: false,
        calendarIntegration: false,
        liveStreaming: false,
        breakoutRooms: false,
        meetingAnalytics: false,
        apiAccess: false,
        advertising: true // Free plan has ads
      },
      startedAt: new Date(),
      expiresAt: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null
    };
  }

  // Activate free plan
  async activateFreePlan(userId) {
    try {
      const subscription = this.getDefaultSubscription(userId);
      
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, plan_name, status, billing_cycle, call_minutes, call_minutes_used, 
            max_participants, features, started_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (user_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           plan_name = EXCLUDED.plan_name,
           status = EXCLUDED.status,
           call_minutes = EXCLUDED.call_minutes,
           call_minutes_used = 0,
           call_minutes_remaining = EXCLUDED.call_minutes`,
          [
            userId, subscription.planId, subscription.planName, subscription.status,
            subscription.billingCycle, subscription.callMinutes, 0,
            subscription.maxParticipants, JSON.stringify(subscription.features),
            subscription.startedAt, null
          ]
        );
      } else {
        this.subscriptions.set(userId, subscription);
      }

      logger.info(`Free plan activated for user: ${userId}`);
      return subscription;
    } catch (error) {
      logger.error('Error activating free plan:', error);
      throw error;
    }
  }

  // Create subscription (for paid plans)
  async createSubscription(userId, planId, stripeSubscriptionId, stripeCustomerId) {
    try {
      const plans = {
        free: { callMinutes: 120, maxParticipants: -1, price: 0 }, // -1 = unlimited
        basic: { callMinutes: 600, maxParticipants: -1, price: 1.99 }, // -1 = unlimited
        pro: { callMinutes: -1, maxParticipants: -1, price: 4.99 }, // -1 = unlimited
        yearly: { callMinutes: -1, maxParticipants: -1, price: 50 } // -1 = unlimited
      };

      const plan = plans[planId] || plans.free;
      const billingCycle = planId === 'yearly' ? 'yearly' : 'monthly';
      
      const subscription = {
        userId,
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        status: 'active',
        billingCycle,
        callMinutes: plan.callMinutes,
        callMinutesUsed: 0,
        callMinutesRemaining: plan.callMinutes,
        maxParticipants: plan.maxParticipants,
        features: {
          recording: planId !== 'free', // Basic, Pro, Yearly have recording
          cloudRecording: planId === 'pro' || planId === 'yearly', // Only Pro and Yearly have cloud recording
          customBranding: planId === 'pro' || planId === 'yearly',
          prioritySupport: planId === 'pro' || planId === 'yearly',
          advancedFeatures: planId === 'pro' || planId === 'yearly', // Includes streaming, breakout rooms, analytics, etc.
          calendarIntegration: planId === 'pro' || planId === 'yearly',
          liveStreaming: planId === 'pro' || planId === 'yearly',
          breakoutRooms: planId === 'pro' || planId === 'yearly',
          meetingAnalytics: planId === 'pro' || planId === 'yearly',
          apiAccess: planId === 'pro' || planId === 'yearly',
          advertising: planId === 'free' // Only Free plan has ads
        },
        startedAt: new Date(),
        expiresAt: billingCycle === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId,
        stripeCustomerId
      };

      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, plan_name, status, billing_cycle, call_minutes, call_minutes_used,
            call_minutes_remaining, max_participants, features, started_at, expires_at,
            stripe_subscription_id, stripe_customer_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (user_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           plan_name = EXCLUDED.plan_name,
           status = EXCLUDED.status,
           billing_cycle = EXCLUDED.billing_cycle,
           call_minutes = EXCLUDED.call_minutes,
           call_minutes_remaining = EXCLUDED.call_minutes,
           expires_at = EXCLUDED.expires_at,
           stripe_subscription_id = EXCLUDED.stripe_subscription_id,
           stripe_customer_id = EXCLUDED.stripe_customer_id`,
          [
            userId, subscription.planId, subscription.planName, subscription.status,
            subscription.billingCycle, subscription.callMinutes, 0,
            subscription.callMinutesRemaining, subscription.maxParticipants,
            JSON.stringify(subscription.features), subscription.startedAt,
            subscription.expiresAt, stripeSubscriptionId, stripeCustomerId
          ]
        );
      } else {
        this.subscriptions.set(userId, subscription);
      }

      logger.info(`Subscription created for user: ${userId}, plan: ${planId}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Track call minutes usage
  async trackCallMinutes(userId, minutes) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      // Unlimited plans don't need tracking
      if (subscription.callMinutes === -1) {
        return { allowed: true, remaining: -1 };
      }

      const newUsed = subscription.callMinutesUsed + minutes;
      const remaining = subscription.callMinutes - newUsed;

      if (remaining < 0) {
        return { allowed: false, remaining: 0 };
      }

      // Update usage
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          'UPDATE user_subscriptions SET call_minutes_used = $1, call_minutes_remaining = $2 WHERE user_id = $3',
          [newUsed, remaining, userId]
        );
      } else {
        subscription.callMinutesUsed = newUsed;
        subscription.callMinutesRemaining = remaining;
        this.subscriptions.set(userId, subscription);
      }

      return { allowed: true, remaining };
    } catch (error) {
      logger.error('Error tracking call minutes:', error);
      return { allowed: true, remaining: -1 }; // Allow on error
    }
  }

  // Reset monthly usage (should be called monthly)
  async resetMonthlyUsage(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          'UPDATE user_subscriptions SET call_minutes_used = 0, call_minutes_remaining = call_minutes WHERE user_id = $1',
          [userId]
        );
      } else {
        subscription.callMinutesUsed = 0;
        subscription.callMinutesRemaining = subscription.callMinutes;
        this.subscriptions.set(userId, subscription);
      }
    } catch (error) {
      logger.error('Error resetting monthly usage:', error);
    }
  }

  // Check if user can perform action
  async canPerformAction(userId, action) {
    const subscription = await this.getUserSubscription(userId);
    
    switch (action) {
      case 'createMeeting':
        return true; // All plans can create meetings
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
  }

  // Check if user has enough call minutes remaining
  async checkCallMinutesLimit(userId, requiredMinutes = 0) {
    const subscription = await this.getUserSubscription(userId);
    
    // Unlimited plans
    if (subscription.callMinutes === -1) {
      return { allowed: true, remaining: -1 };
    }
    
    // Check if user has enough minutes
    const remaining = subscription.callMinutesRemaining || subscription.callMinutes - (subscription.callMinutesUsed || 0);
    
    if (remaining >= requiredMinutes) {
      return { allowed: true, remaining };
    }
    
    return { allowed: false, remaining, message: 'Insufficient call minutes. Please upgrade your plan.' };
  }

  // Grant premium subscription (admin-granted, no payment required)
  async grantPremiumSubscription(userId) {
    try {
      const subscription = {
        userId,
        planId: 'pro',
        planName: 'Pro',
        status: 'active',
        billingCycle: 'monthly',
        callMinutes: -1, // unlimited
        callMinutesUsed: 0,
        callMinutesRemaining: -1,
        maxParticipants: -1, // unlimited
        features: {
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
        startedAt: new Date(),
        expiresAt: null, // Admin-granted subscriptions don't expire
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        adminGranted: true // Flag to indicate this was admin-granted
      };

      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, plan_name, status, billing_cycle, call_minutes, call_minutes_used,
            call_minutes_remaining, max_participants, features, started_at, expires_at,
            stripe_subscription_id, stripe_customer_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (user_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           plan_name = EXCLUDED.plan_name,
           status = EXCLUDED.status,
           billing_cycle = EXCLUDED.billing_cycle,
           call_minutes = EXCLUDED.call_minutes,
           call_minutes_used = 0,
           call_minutes_remaining = EXCLUDED.call_minutes_remaining,
           expires_at = EXCLUDED.expires_at,
           stripe_subscription_id = EXCLUDED.stripe_subscription_id,
           stripe_customer_id = EXCLUDED.stripe_customer_id`,
          [
            userId, subscription.planId, subscription.planName, subscription.status,
            subscription.billingCycle, subscription.callMinutes, 0,
            subscription.callMinutesRemaining, subscription.maxParticipants,
            JSON.stringify(subscription.features), subscription.startedAt,
            subscription.expiresAt, null, null
          ]
        );
      } else {
        this.subscriptions.set(userId, subscription);
      }

      logger.info(`Premium subscription granted to user: ${userId} by admin`);
      return subscription;
    } catch (error) {
      logger.error('Error granting premium subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2',
          ['cancelled', userId]
        );
      } else {
        const subscription = this.subscriptions.get(userId);
        if (subscription) {
          subscription.status = 'cancelled';
          this.subscriptions.set(userId, subscription);
        }
      }
      logger.info(`Subscription cancelled for user: ${userId}`);
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();

