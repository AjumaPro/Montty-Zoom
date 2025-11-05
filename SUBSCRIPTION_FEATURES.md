# Subscription Package Features & Limitations

## Package Comparison

### FREE Plan
**Price:** $0/month  
**Call Minutes:** 120 minutes (2 hours) per month  
**Participants:** Unlimited  
**Features:**
- ✅ HD video quality
- ✅ Screen sharing
- ✅ Chat messaging
- ✅ Basic meeting features
- ✅ Google advertising included
- ❌ Recording (local or cloud)
- ❌ Custom branding
- ❌ Priority support
- ❌ Advanced features
- ❌ Calendar integration
- ❌ Live streaming
- ❌ Breakout rooms
- ❌ Meeting analytics
- ❌ API access

**Limitations:**
- Max 10 meetings per month
- Advertising shown during meetings

---

### BASIC Plan ($1.99/month)
**Price:** $1.99/month  
**Call Minutes:** 600 minutes (10 hours) per month  
**Participants:** Unlimited  
**Features:**
- ✅ HD video quality
- ✅ Screen sharing
- ✅ Chat messaging
- ✅ Recording (local only)
- ✅ Email support
- ✅ Meeting scheduling
- ✅ No advertising
- ❌ Cloud recording
- ❌ Custom branding
- ❌ Priority support
- ❌ Advanced features
- ❌ Calendar integration
- ❌ Live streaming
- ❌ Breakout rooms
- ❌ Meeting analytics
- ❌ API access

**Limitations:**
- Max 50 meetings per month
- Local recording only (no cloud storage)

---

### PRO Plan ($4.99/month)
**Price:** $4.99/month  
**Call Minutes:** Unlimited  
**Participants:** Unlimited  
**Features:**
- ✅ HD video quality
- ✅ Screen sharing
- ✅ Chat messaging
- ✅ Cloud recording
- ✅ Custom branding
- ✅ Priority support
- ✅ Advanced features
- ✅ Calendar integration
- ✅ Live streaming
- ✅ Breakout rooms
- ✅ Meeting analytics
- ✅ API access
- ✅ Get every new update
- ✅ No advertising

**Limitations:**
- None - Full access to all features

---

### YEARLY Plan ($50/year)
**Price:** $50/year (~$4.17/month)  
**Call Minutes:** Unlimited  
**Participants:** Unlimited  
**Features:**
- ✅ All Pro plan features
- ✅ Same as Pro plan

**Limitations:**
- None - Full access to all features

---

## Feature Enforcement

### Backend API Endpoints

1. **Check Feature Access**
   ```
   POST /api/subscription/check-feature
   Body: { userId: string, action: string }
   Actions: 'record', 'recordCloud', 'customBranding', 'apiAccess', 
            'calendarIntegration', 'liveStreaming', 'breakoutRooms', 
            'meetingAnalytics', 'advancedFeatures'
   ```

2. **Check Call Minutes**
   ```
   POST /api/subscription/check-minutes
   Body: { userId: string, requiredMinutes: number }
   Returns: { allowed: boolean, remaining: number, message?: string }
   ```

3. **Track Usage**
   ```
   POST /api/subscription/track-usage
   Body: { userId: string, minutes: number }
   Returns: { allowed: boolean, remaining: number }
   ```

### Frontend Utilities

Use `subscriptionFeatures.js` utility functions:
- `hasFeature(planId, feature)` - Check if plan has feature
- `getCallMinutesLimit(planId)` - Get call minutes limit
- `canPerformAction(subscription, action)` - Check if user can perform action
- `getPlanLimitations(planId)` - Get all plan limitations

## Implementation Notes

1. **Call Minutes Tracking:**
   - Free: 120 minutes/month
   - Basic: 600 minutes/month
   - Pro/Yearly: Unlimited (-1)
   - Tracked via `trackCallMinutes()` method
   - Reset monthly via `resetMonthlyUsage()`

2. **Feature Flags:**
   - Stored in `subscription.features` object
   - Checked via `canPerformAction()` method
   - Enforced on backend before allowing actions

3. **Recording Distinction:**
   - Basic plan: Local recording only (`recording: true`, `cloudRecording: false`)
   - Pro/Yearly: Cloud recording (`recording: true`, `cloudRecording: true`)

4. **Advanced Features:**
   - Only Pro and Yearly plans have:
     - Calendar integration
     - Live streaming
     - Breakout rooms
     - Meeting analytics
     - API access

## Usage Examples

### Check if user can record
```javascript
const canRecord = await subscriptionService.canPerformAction(userId, 'record');
```

### Check if user can use cloud recording
```javascript
const canCloudRecord = await subscriptionService.canPerformAction(userId, 'recordCloud');
```

### Check call minutes before starting meeting
```javascript
const checkResult = await subscriptionService.checkCallMinutesLimit(userId, 60);
if (!checkResult.allowed) {
  // Show upgrade prompt
}
```

### Track meeting minutes
```javascript
const result = await subscriptionService.trackCallMinutes(userId, meetingDuration);
if (!result.allowed) {
  // End meeting or show upgrade prompt
}
```

