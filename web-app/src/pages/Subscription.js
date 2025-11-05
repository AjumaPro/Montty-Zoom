import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HiCreditCard,
  HiCalendar,
  HiChartBar,
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiChevronRight,
  HiClock,
  HiCurrencyDollar,
  HiUserGroup,
  HiVideoCamera,
  HiStar,
  HiExclamationTriangle
} from 'react-icons/hi2';
import { PLANS } from '../utils/pricingPlans';
import './Subscription.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Subscription() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    // Ensure userId exists, if not, redirect to signin
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Please sign in to view subscription');
      navigate('/signin');
      return;
    }
    
    loadSubscription();
    loadBillingHistory();
  }, []);

  // Fallback: If no subscription after loading and we have userId, show default free plan
  useEffect(() => {
    if (!loading && !subscription) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        // Create a default free subscription object to display
        const defaultFreePlan = {
          userId,
          planId: 'free',
          planName: 'Free',
          status: 'active',
          billingCycle: 'monthly',
          callMinutes: 120,
          callMinutesUsed: 0,
          callMinutesRemaining: 120,
          maxParticipants: -1,
          features: {
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
          startedAt: new Date(),
          expiresAt: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null
        };
        
        setSubscription(defaultFreePlan);
        
        // Try to activate on server in background
        fetch(`${API_URL}/api/subscription/activate-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ userId })
        }).catch(() => {
          // Silently fail - we're showing the default anyway
        });
      }
    }
  }, [loading, subscription]);

  const loadSubscription = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please sign in to view subscription');
        navigate('/signin');
        return;
      }

      let response;
      try {
        response = await fetch(`${API_URL}/api/subscription?userId=${userId}`, {
          credentials: 'include'
        });
      } catch (fetchError) {
        console.error('Network error fetching subscription:', fetchError);
        // If network error, try to activate free plan anyway
        await activateFreePlanFallback(userId);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
        setLoading(false);
      } else if (response.status === 404) {
        // Auto-activate free plan if no subscription exists
        await activateFreePlanFallback(userId);
      } else {
        // Try to activate free plan as fallback for other errors
        const errorData = await response.json().catch(() => ({ error: 'Failed to load subscription' }));
        console.error('Error loading subscription:', errorData);
        await activateFreePlanFallback(userId);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Try to activate free plan as last resort
      const userId = localStorage.getItem('userId');
      if (userId) {
        await activateFreePlanFallback(userId);
      } else {
        setLoading(false);
        toast.error('Failed to load subscription details');
      }
    }
  };

  const activateFreePlanFallback = async (userId) => {
    try {
      const activateResponse = await fetch(`${API_URL}/api/subscription/activate-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      
      if (activateResponse.ok) {
        const result = await activateResponse.json();
        setSubscription(result.subscription || result);
        toast.success('Free plan activated!');
      } else {
        const errorData = await activateResponse.json().catch(() => ({ error: 'Failed to activate free plan' }));
        console.error('Failed to activate free plan:', errorData);
        toast.warning('Could not activate free plan automatically. Please try again.');
      }
    } catch (activateError) {
      console.error('Error activating free plan:', activateError);
      toast.error('Failed to activate free plan. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadBillingHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`${API_URL}/api/subscription/billing-history?userId=${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.history || []);
      } else {
        // If endpoint doesn't exist yet, use empty array
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
      setBillingHistory([]);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        setShowCancelModal(false);
        loadSubscription();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return 'Free';
    return `$${amount.toFixed(2)}`;
  };

  const getPlanDetails = (planId) => {
    const planMap = {
      free: PLANS.FREE,
      basic: PLANS.BASIC,
      pro: PLANS.PRO,
      yearly: PLANS.YEARLY
    };
    return planMap[planId] || PLANS.FREE;
  };

  const formatMinutes = (minutes) => {
    if (minutes === -1) return 'Unlimited';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getUsagePercentage = () => {
    if (!subscription || subscription.callMinutes === -1) return 0;
    if (subscription.callMinutes === 0) return 0;
    return (subscription.callMinutesUsed / subscription.callMinutes) * 100;
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  // Show loading or error state
  if (!subscription && !loading) {
    return (
      <div className="subscription-page">
        <div className="error-container">
          <HiExclamationTriangle className="error-icon" />
          <h2>No Subscription Found</h2>
          <p>You don't have an active subscription. Start with our free plan!</p>
          <button className="btn-primary" onClick={() => navigate('/pricing')}>
            View Plans
          </button>
        </div>
      </div>
    );
  }

  // If still loading after trying to activate free plan, show loading
  if (!subscription) {
    return (
      <div className="subscription-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  const planDetails = getPlanDetails(subscription.planId);
  const usagePercentage = getUsagePercentage();

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        {/* Header */}
        <div className="subscription-header">
          <h1>Subscription & Billing</h1>
          <p>Manage your subscription, view usage, and billing history</p>
        </div>

        {/* Current Plan Card */}
        <div className="subscription-card current-plan-card">
          <div className="card-header">
            <div className="plan-status">
              <span className={`status-badge ${subscription.status}`}>
                {subscription.status === 'active' ? <HiCheckCircle /> : <HiXCircle />}
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
            <button 
              className="btn-secondary btn-sm"
              onClick={() => navigate('/pricing')}
            >
              <HiArrowPath /> Change Plan
            </button>
          </div>

          <div className="plan-info">
            <h2>{planDetails.name} Plan</h2>
            <div className="plan-price-display">
              <span className="price-amount">
                {subscription.planId === 'free' 
                  ? 'Free' 
                  : subscription.billingCycle === 'yearly'
                  ? `$${PLANS.YEARLY.monthlyEquivalent}/month`
                  : `$${planDetails.price}/month`}
              </span>
              {subscription.billingCycle && subscription.planId !== 'free' && (
                <span className="billing-cycle">
                  Billed {subscription.billingCycle === 'yearly' ? 'annually' : 'monthly'}
                </span>
              )}
            </div>
            <p className="plan-description">{planDetails.description}</p>

            {subscription.expiresAt && (
              <div className="expiry-info">
                <HiCalendar />
                <span>
                  {subscription.billingCycle === 'yearly' ? 'Renews' : 'Next billing'}: {formatDate(subscription.expiresAt)}
                </span>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          <div className="usage-stats">
            <div className="usage-item">
              <div className="usage-label">
                <HiVideoCamera />
                Call Minutes
              </div>
              <div className="usage-value">
                {subscription.callMinutes === -1 ? (
                  <span className="unlimited">Unlimited</span>
                ) : (
                  <>
                    <span className="used">{formatMinutes(subscription.callMinutesUsed)}</span>
                    <span className="separator">/</span>
                    <span className="total">{formatMinutes(subscription.callMinutes)}</span>
                  </>
                )}
              </div>
              {subscription.callMinutes !== -1 && (
                <div className="usage-bar">
                  <div 
                    className="usage-bar-fill" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="usage-item">
              <div className="usage-label">
                <HiUserGroup />
                Max Participants
              </div>
              <div className="usage-value">
                {subscription.maxParticipants === -1 ? (
                  <span className="unlimited">Unlimited</span>
                ) : (
                  subscription.maxParticipants
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="subscription-card features-card">
          <h3>Plan Features</h3>
          <div className="features-grid">
            {Object.entries(subscription.features || {}).map(([feature, enabled]) => (
              <div key={feature} className={`feature-item ${enabled ? 'enabled' : 'disabled'}`}>
                {enabled ? <HiCheckCircle className="feature-icon enabled" /> : <HiXCircle className="feature-icon disabled" />}
                <span className="feature-name">
                  {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Information */}
        <div className="subscription-card billing-info-card">
          <div className="card-header">
            <h3>
              <HiCreditCard /> Billing Information
            </h3>
          </div>
          
          <div className="billing-info-grid">
            <div className="billing-info-item">
              <div className="info-label">Payment Method</div>
              <div className="info-value">
                {subscription.stripeCustomerId ? (
                  <span className="payment-method">
                    <HiCreditCard /> Card ending in ****
                    <button className="btn-link" onClick={() => toast.info('Payment method management coming soon')}>
                      Update
                    </button>
                  </span>
                ) : (
                  <span className="no-payment">
                    No payment method on file
                    {subscription.planId !== 'free' && (
                      <button className="btn-link" onClick={() => navigate('/pricing')}>
                        Add Payment Method
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="billing-info-item">
              <div className="info-label">Billing Address</div>
              <div className="info-value">
                {subscription.billingAddress ? (
                  <span className="billing-address">
                    {subscription.billingAddress}
                    <button className="btn-link" onClick={() => toast.info('Billing address management coming soon')}>
                      Update
                    </button>
                  </span>
                ) : (
                  <span className="no-address">
                    No billing address on file
                    {subscription.planId !== 'free' && (
                      <button className="btn-link" onClick={() => toast.info('Billing address management coming soon')}>
                        Add Address
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>

            {subscription.stripeSubscriptionId && (
              <div className="billing-info-item">
                <div className="info-label">Subscription ID</div>
                <div className="info-value subscription-id">
                  {subscription.stripeSubscriptionId.substring(0, 20)}...
                  <button 
                    className="btn-link" 
                    onClick={() => {
                      navigator.clipboard.writeText(subscription.stripeSubscriptionId);
                      toast.success('Subscription ID copied to clipboard');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div className="subscription-card billing-history-card">
          <div className="card-header">
            <h3>
              <HiCalendar /> Billing History
            </h3>
          </div>
          
          {billingHistory.length > 0 ? (
            <div className="billing-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, index) => (
                    <tr key={index}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.description}</td>
                      <td className="amount-cell">{formatCurrency(item.amount)}</td>
                      <td>
                        <span className={`status-badge ${item.status || 'paid'}`}>
                          {item.status === 'paid' ? <HiCheckCircle /> : <HiXCircle />}
                          {item.status || 'Paid'}
                        </span>
                      </td>
                      <td>
                        {item.receiptUrl ? (
                          <a 
                            href={item.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="invoice-link"
                          >
                            <HiArrowPath /> Download
                          </a>
                        ) : (
                          <button 
                            className="btn-link"
                            onClick={() => toast.info('Invoice generation coming soon')}
                          >
                            Generate Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-billing">
              <HiCalendar className="empty-icon" />
              <p>No billing history available</p>
              {subscription.planId === 'free' && (
                <p className="empty-subtext">Upgrade to a paid plan to see billing history</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="subscription-actions">
          {subscription.planId !== 'free' && (
            <>
              <button 
                className="btn-secondary"
                onClick={() => setShowUpgradeModal(true)}
              >
                Upgrade Plan
              </button>
              {subscription.status === 'active' && (
                <button 
                  className="btn-danger"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Subscription
                </button>
              )}
            </>
          )}
          {subscription.planId === 'free' && (
            <button 
              className="btn-primary"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Subscription</h3>
            <p>Are you sure you want to cancel your subscription? Your plan will remain active until the end of the billing period.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Keep Subscription
              </button>
              <button className="btn-danger" onClick={handleCancelSubscription}>
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upgrade Plan</h3>
            <p>Upgrade to unlock more features and capabilities.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => {
                setShowUpgradeModal(false);
                navigate('/pricing');
              }}>
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;

