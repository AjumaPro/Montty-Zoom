# SaaS Pricing & Subscription Guide

## Overview

Montty Zoom is now configured as a SaaS platform with subscription-based pricing:

- **Free Plan**: 2 hours/month with Google advertising
- **Basic Plan**: $1.99/month - 10 hours/month
- **Pro Plan**: $4.99/month - Unlimited minutes + all features
- **Yearly Plan**: $50/year - Same as Pro, save 17%

## Features Implemented

### Frontend
- ✅ Pricing page (`/pricing`)
- ✅ Plan comparison table
- ✅ Monthly/Yearly billing toggle
- ✅ Subscription management UI
- ✅ Plan features configuration

### Backend
- ✅ Subscription service
- ✅ Usage tracking API
- ✅ Call minutes tracking
- ✅ Plan limitations enforcement
- ✅ Database schema for subscriptions

## Next Steps for Full SaaS Implementation

### 1. Payment Integration (Stripe)

Install Stripe:
```bash
npm install stripe
```

Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Update `server/index.js` to use real Stripe checkout:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In create-checkout endpoint:
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: plan.name },
      unit_amount: plan.price * 100, // Convert to cents
      recurring: { interval: billingCycle === 'yearly' ? 'year' : 'month' }
    },
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.FRONTEND_URL}/pricing`,
  client_reference_id: userId,
});
```

### 2. Webhook Handler

Create webhook endpoint for Stripe events:
```javascript
app.post('/api/subscription/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  
  // Handle subscription events
  if (event.type === 'checkout.session.completed') {
    // Activate subscription
  }
  if (event.type === 'customer.subscription.deleted') {
    // Cancel subscription
  }
  // etc.
});
```

### 3. Usage Tracking Integration

Add to room creation/joining:
```javascript
// Before allowing meeting start, check subscription
const subscription = await subscriptionService.getUserSubscription(userId);
if (subscription.callMinutesRemaining <= 0 && subscription.callMinutes !== -1) {
  return res.status(403).json({ error: 'Call minutes exhausted. Please upgrade.' });
}
```

Track call duration:
```javascript
// When meeting ends
const duration = Math.ceil((endTime - startTime) / 60000); // minutes
await subscriptionService.trackCallMinutes(userId, duration);
```

### 4. Google AdSense Integration

Add to Free plan users:
```html
<!-- In Room.js or Home.js, show ads for free users -->
{subscription.planId === 'free' && (
  <div className="ads-container">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
    <ins className="adsbygoogle" ... />
  </div>
)}
```

### 5. Plan Enforcement

Update room creation to check limits:
- Max participants
- Feature access (recording, etc.)
- Call minutes remaining

### 6. Monthly Reset Job

Create cron job to reset usage monthly:
```javascript
// Reset usage for all users monthly
cron.schedule('0 0 1 * *', async () => {
  // Reset all users' call minutes
});
```

## Database Schema

The subscription table includes:
- User ID
- Plan details
- Usage tracking
- Stripe integration fields
- Expiration dates

## API Endpoints

- `GET /api/subscription` - Get user subscription
- `POST /api/subscription/activate-free` - Activate free plan
- `POST /api/subscription/create-checkout` - Create payment checkout
- `POST /api/subscription/track-usage` - Track call minutes
- `POST /api/subscription/cancel` - Cancel subscription

## Testing

1. Test free plan activation
2. Test checkout flow (with Stripe test mode)
3. Test usage tracking
4. Test plan limitations
5. Test monthly reset

## Security Considerations

- Never expose Stripe secret keys
- Validate webhook signatures
- Implement rate limiting on subscription endpoints
- Validate user ownership before subscription changes
- Encrypt sensitive subscription data

## Revenue Model

- Free: Ad revenue from Google AdSense
- Basic: $1.99/month × users
- Pro: $4.99/month × users
- Yearly: $50/year × users (save 17%)

## Monitoring

Track:
- Subscription conversion rates
- Churn rate
- Average revenue per user (ARPU)
- Call minutes usage
- Feature adoption rates

