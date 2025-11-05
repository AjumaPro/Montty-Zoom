# How the System Knows When a Customer Calls

## Overview
The system detects customer calls through **multiple methods** depending on your setup:

---

## 1. **Webhook Integration (Automatic Detection)**
For phone systems like **Twilio**, **Vonage**, or similar services:

### Setup:
1. **Configure your telephony provider** to send webhooks to:
   - Incoming calls: `POST https://your-domain.com/api/webhooks/call/incoming`
   - Call status updates: `POST https://your-domain.com/api/webhooks/call/status`

2. **Webhook automatically creates call records** when:
   - A customer calls your support number
   - The call status changes (ringing, in-progress, completed)
   - The call ends

### Example Webhook Payload (Twilio):
```json
{
  "CallSid": "CA1234567890",
  "From": "+1234567890",
  "To": "+0987654321",
  "CallStatus": "ringing",
  "Direction": "inbound",
  "CallDuration": "120"
}
```

### What Happens:
- ✅ Call record created automatically
- ✅ Real-time notification sent to admin dashboard
- ✅ Call appears in Call Queue immediately
- ✅ Activity logged

---

## 2. **Customer Support Request Form (Manual Entry)**
Customers can submit support requests through your website/app:

### Endpoint:
```
POST /api/customer/support-request
```

### Request Body:
```json
{
  "userId": "user123",
  "userEmail": "customer@example.com",
  "subject": "Billing Question",
  "description": "I need help with my invoice",
  "priority": "high",
  "phoneNumber": "+1234567890"
}
```

### What Happens:
- ✅ Support request created
- ✅ Real-time notification to admins
- ✅ Appears in Call Queue as "pending"
- ✅ Agent can call customer back

---

## 3. **Admin Manual Creation**
Admins can manually create call records in the dashboard:

### Endpoint:
```
POST /api/admin/customer-service/calls
```

### Use Cases:
- Returning customer calls
- Follow-up calls
- Outbound calls
- Manual logging

---

## 4. **Real-Time Notifications (Socket.io)**

### Events Emitted:
- `new-call` - When a new call is received
- `new-support-request` - When a support request is created
- `call-status-updated` - When call status changes
- `call-assigned` - When a call is assigned to an agent

### Frontend Integration:
```javascript
// Connect to call center notifications
socket.emit('join-call-center', { userEmail: 'admin@example.com' });

// Listen for new calls
socket.on('new-call', (data) => {
  console.log('New call received:', data.call);
  // Update UI, show notification, etc.
});

socket.on('call-status-updated', (data) => {
  console.log('Call status updated:', data);
  // Update call status in UI
});
```

---

## Current Implementation Status

### ✅ **Implemented:**
- Webhook endpoints for incoming calls
- Webhook for call status updates
- Public support request endpoint
- Real-time Socket.io notifications
- Automatic call record creation
- Activity logging

### ⚠️ **Requires Setup:**
1. **Telephony Provider Integration:**
   - Sign up for Twilio, Vonage, or similar
   - Configure webhook URLs in provider dashboard
   - Point webhooks to your server endpoints

2. **Frontend Integration:**
   - Connect Socket.io client to server
   - Listen for call events
   - Update UI in real-time

3. **Environment Variables (Optional):**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## How to Test

### 1. Test Support Request (No Setup Required):
```bash
curl -X POST http://localhost:5000/api/customer/support-request \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "subject": "Test Call",
    "description": "This is a test support request"
  }'
```

### 2. Test Webhook (Simulate Twilio):
```bash
curl -X POST http://localhost:5000/api/webhooks/call/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "CA123",
    "From": "+1234567890",
    "To": "+0987654321",
    "CallStatus": "ringing",
    "Direction": "inbound"
  }'
```

### 3. Check Call Center Dashboard:
- Navigate to Admin Dashboard → Call Center
- You should see the call appear in the queue
- Check real-time notifications

---

## Next Steps

1. **Integrate with Telephony Provider:**
   - Choose provider (Twilio recommended)
   - Set up phone number
   - Configure webhooks

2. **Add Frontend Real-Time Updates:**
   - Update `AdminCallCenter.js` to listen for Socket.io events
   - Show toast notifications for new calls
   - Auto-refresh call queue

3. **Optional Enhancements:**
   - Call recording integration
   - IVR (Interactive Voice Response)
   - Call routing logic
   - Agent availability tracking

---

## Summary

**The system knows when a customer calls through:**
1. ✅ **Webhooks** from telephony providers (automatic)
2. ✅ **Support request forms** (customer-initiated)
3. ✅ **Manual admin creation** (admin-initiated)
4. ✅ **Real-time notifications** via Socket.io

All calls are automatically logged and appear in the Call Center dashboard in real-time!

