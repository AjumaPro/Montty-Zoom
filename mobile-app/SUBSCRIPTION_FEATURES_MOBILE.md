# Mobile App Subscription Features Implementation

## Overview

The mobile app now has comprehensive subscription feature checking and enforcement, similar to the web application.

## Files Created

### 1. `lib/utils/subscription_features.dart`
Utility class with static methods for checking subscription features:
- `hasFeature(planId, feature)` - Check if plan has feature
- `getCallMinutesLimit(planId)` - Get call minutes limit
- `hasUnlimitedMinutes(planId)` - Check if unlimited
- `canPerformAction(subscription, action)` - Check if user can perform action
- `formatFeatureName(feature)` - Format feature names for display
- `formatMinutes(minutes)` - Format minutes for display

### 2. `lib/services/subscription_service.dart`
Service class for API calls:
- `getUserSubscription(userId)` - Get user's subscription
- `checkFeature(userId, action)` - Check feature availability
- `checkCallMinutes(userId, requiredMinutes)` - Check minutes limit
- `trackCallMinutes(userId, minutes)` - Track usage
- `activateFreePlan(userId)` - Activate free plan
- `cancelSubscription(userId)` - Cancel subscription

### 3. `lib/widgets/feature_check_widget.dart`
Reusable widgets:
- `FeatureCheckWidget` - Check feature and conditionally render widget
- `UpgradePromptWidget` - Show upgrade prompt for premium features
- `CallMinutesCheckWidget` - Check minutes before allowing action

## Usage Examples

### Example 1: Check Feature Before Showing Button

```dart
import 'package:flutter/material.dart';
import '../widgets/feature_check_widget.dart';
import '../services/subscription_service.dart';

class MeetingScreen extends StatelessWidget {
  final String userId;
  
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Only show recording button if user has recording feature
        FeatureCheckWidget(
          userId: userId,
          action: 'record',
          builder: (context, hasFeature) {
            return ElevatedButton(
              onPressed: () => startRecording(),
              child: const Text('Record Meeting'),
            );
          },
          fallback: UpgradePromptWidget(
            featureName: 'Recording',
            planName: 'Basic',
          ),
        ),
      ],
    );
  }
}
```

### Example 2: Check Cloud Recording

```dart
FeatureCheckWidget(
  userId: userId,
  action: 'recordCloud',
  builder: (context, hasFeature) {
    return ElevatedButton(
      onPressed: () => startCloudRecording(),
      child: const Text('Record to Cloud'),
    );
  },
  fallback: UpgradePromptWidget(
    featureName: 'Cloud Recording',
    planName: 'Pro',
  ),
),
```

### Example 3: Check Call Minutes Before Starting Meeting

```dart
CallMinutesCheckWidget(
  userId: userId,
  requiredMinutes: 60, // 1 hour meeting
  builder: (context, allowed, remaining) {
    if (allowed) {
      return ElevatedButton(
        onPressed: () => startMeeting(),
        child: Text('Start Meeting (${remaining} min remaining)'),
      );
    } else {
      return UpgradePromptWidget(
        featureName: 'More Call Minutes',
        planName: 'Basic',
      );
    }
  },
),
```

### Example 4: Check Feature Programmatically

```dart
import '../services/subscription_service.dart';
import '../utils/subscription_features.dart';

Future<void> startRecording() async {
  final subscriptionService = SubscriptionService();
  
  // Check if user can record
  final canRecord = await subscriptionService.checkFeature(userId, 'record');
  
  if (canRecord) {
    // Start recording
    await startRecordingProcess();
  } else {
    // Show upgrade prompt
    showUpgradeDialog();
  }
}
```

### Example 5: Check Subscription Object Directly

```dart
import '../utils/subscription_features.dart';

void checkFeatures(Map<String, dynamic> subscription) {
  // Check if user can perform action
  final canRecord = SubscriptionFeatures.canPerformAction(
    subscription, 
    'record'
  );
  
  final canStream = SubscriptionFeatures.canPerformAction(
    subscription, 
    'liveStreaming'
  );
  
  final canAnalytics = SubscriptionFeatures.canPerformAction(
    subscription, 
    'meetingAnalytics'
  );
  
  // Use these flags to enable/disable UI elements
}
```

### Example 6: Track Call Minutes After Meeting

```dart
import '../services/subscription_service.dart';

Future<void> endMeeting(int durationMinutes) async {
  final subscriptionService = SubscriptionService();
  
  // Track minutes used
  final result = await subscriptionService.trackCallMinutes(
    userId, 
    durationMinutes
  );
  
  if (!result['allowed']) {
    // User ran out of minutes
    showUpgradePrompt();
  }
  
  // Show remaining minutes
  final remaining = result['remaining'];
  if (remaining != -1) {
    showSnackBar('You have $remaining minutes remaining this month');
  }
}
```

### Example 7: Get Plan Limitations

```dart
import '../utils/subscription_features.dart';

void showPlanLimits(String planId) {
  final limitations = SubscriptionFeatures.getPlanLimitations(planId);
  
  print('Max Call Minutes: ${limitations['maxCallMinutes']}');
  print('Has Recording: ${limitations['recording']}');
  print('Has Advanced Features: ${limitations['advancedFeatures']}');
}
```

## Integration in Room Screen

To integrate feature checking in the room screen:

```dart
import '../services/subscription_service.dart';
import '../utils/subscription_features.dart';

class RoomScreen extends StatefulWidget {
  // ... existing code
  
  Future<void> _checkRecordingFeature() async {
    final subscriptionService = SubscriptionService();
    final canRecord = await subscriptionService.checkFeature(userId, 'record');
    
    if (canRecord) {
      _startRecording();
    } else {
      // Show upgrade dialog
      _showUpgradeDialog('Recording', 'Basic');
    }
  }
  
  Future<void> _startMeeting() async {
    final subscriptionService = SubscriptionService();
    
    // Check minutes before starting
    final checkResult = await subscriptionService.checkCallMinutes(userId, 0);
    
    if (!checkResult['allowed']) {
      _showUpgradeDialog('More Call Minutes', 'Basic');
      return;
    }
    
    // Start meeting
    _joinRoom();
  }
}
```

## Feature Actions Available

- `record` - Local recording (Basic, Pro, Yearly)
- `recordCloud` - Cloud recording (Pro, Yearly only)
- `customBranding` - Custom branding (Pro, Yearly)
- `apiAccess` - API access (Pro, Yearly)
- `calendarIntegration` - Calendar integration (Pro, Yearly)
- `liveStreaming` - Live streaming (Pro, Yearly)
- `breakoutRooms` - Breakout rooms (Pro, Yearly)
- `meetingAnalytics` - Meeting analytics (Pro, Yearly)
- `advancedFeatures` - Advanced features (Pro, Yearly)

## Next Steps

1. Replace `userId = 'user-placeholder'` with actual userId from state management or SharedPreferences
2. Integrate feature checks in RoomScreen for recording, streaming, etc.
3. Add feature checks before showing premium UI elements
4. Track call minutes when meetings end
5. Show upgrade prompts when users hit limits

