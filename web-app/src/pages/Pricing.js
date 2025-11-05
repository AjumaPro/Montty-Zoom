import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { PLANS, PLAN_FEATURES_COMPARISON, formatPrice } from '../utils/pricingPlans';
import { HiCheck, HiX, HiStar } from 'react-icons/hi2';
import './Pricing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [loading, setLoading] = useState({});

  const handleSubscribe = async (planId) => {
    setLoading({ [planId]: true });
    
    try {
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!isAuthenticated) {
        toast.error('Please sign in to subscribe');
        // Redirect to sign in
        window.location.href = '/signin?redirect=/pricing';
        return;
      }

      if (planId === 'free') {
        // Free plan - just activate
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Please sign in to subscribe');
          window.location.href = '/signin?redirect=/pricing';
          return;
        }

        const response = await fetch(`${API_URL}/api/subscription/activate-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          toast.success('Free plan activated!');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to activate free plan');
        }
      } else {
        // Paid plans - redirect to checkout
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Please sign in to subscribe');
          window.location.href = '/signin?redirect=/pricing';
          return;
        }

        const plan = PLANS[planId.toUpperCase()];
        const finalPrice = billingCycle === 'yearly' && planId === 'pro' 
          ? PLANS.YEARLY.price 
          : plan.price;
        
        const response = await fetch(`${API_URL}/api/subscription/create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            planId: billingCycle === 'yearly' && planId === 'pro' ? 'yearly' : planId,
            billingCycle: billingCycle === 'yearly' && planId === 'pro' ? 'yearly' : plan.billing,
            userId: userId
          })
        });

        const data = await response.json();
        
        if (data.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setLoading({ [planId]: false });
    }
  };

  const displayedPlans = billingCycle === 'yearly' 
    ? [PLANS.FREE, PLANS.BASIC, PLANS.YEARLY]
    : [PLANS.FREE, PLANS.BASIC, PLANS.PRO];

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1>Choose Your Plan</h1>
        <p>Start free, upgrade as you grow</p>
        
        {/* Billing Toggle */}
        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={billingCycle === 'yearly'}
              onChange={(e) => setBillingCycle(e.target.checked ? 'yearly' : 'monthly')}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            Yearly
            <span className="save-badge">Save 17%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards">
        {displayedPlans.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && (
              <div className="popular-badge">
                <HiStar /> Most Popular
              </div>
            )}
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                {plan.id === 'yearly' ? (
                  <>
                    <span className="price-main">${plan.monthlyEquivalent}</span>
                    <span className="price-period">/month</span>
                    <div className="price-yearly">Billed ${plan.price}/year</div>
                  </>
                ) : (
                  <>
                    <span className="price-main">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    <span className="price-period">
                      {plan.price === 0 ? '' : billingCycle === 'yearly' && plan.id === 'pro' 
                        ? '/month (billed yearly)' 
                        : '/month'}
                    </span>
                  </>
                )}
              </div>
              <p className="plan-description">{plan.description}</p>
            </div>

            <div className="plan-features">
              <ul>
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <HiCheck className="feature-icon" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="plan-action">
              <button
                className={`btn-subscribe ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading[plan.id]}
              >
                {loading[plan.id] ? 'Processing...' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="feature-comparison">
        <h2>Compare Plans</h2>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Basic</th>
                <th>Pro</th>
                <th>Yearly</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES_COMPARISON.map((row, index) => (
                <tr key={index}>
                  <td className="feature-name">{row.feature}</td>
                  <td>{row.free}</td>
                  <td>{row.basic}</td>
                  <td>{row.pro}</td>
                  <td>{row.yearly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>Can I change plans later?</h3>
            <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be billed proportionally.</p>
          </div>
          <div className="faq-item">
            <h3>What happens to unused call minutes?</h3>
            <p>Call minutes reset monthly. Unused minutes don't roll over to the next month.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>Yes, we offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.</p>
          </div>
          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards, debit cards, and PayPal through our secure payment processor.</p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel anytime?</h3>
            <p>Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your billing period.</p>
          </div>
          <div className="faq-item">
            <h3>What's included in "Get every new update"?</h3>
            <p>Pro and Yearly subscribers get access to all new features, improvements, and updates as soon as they're released, at no additional cost.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

