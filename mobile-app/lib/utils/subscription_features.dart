// Subscription Feature Utilities for Mobile App
// Helper functions to check subscription features and limitations

class SubscriptionFeatures {
  /// Check if a feature is available for a plan
  static bool hasFeature(String planId, String feature) {
    final featureMap = {
      'free': {
        'recording': false,
        'cloudRecording': false,
        'customBranding': false,
        'prioritySupport': false,
        'advancedFeatures': false,
        'calendarIntegration': false,
        'liveStreaming': false,
        'breakoutRooms': false,
        'meetingAnalytics': false,
        'apiAccess': false,
        'advertising': true,
      },
      'basic': {
        'recording': true,
        'cloudRecording': false,
        'customBranding': false,
        'prioritySupport': false,
        'advancedFeatures': false,
        'calendarIntegration': false,
        'liveStreaming': false,
        'breakoutRooms': false,
        'meetingAnalytics': false,
        'apiAccess': false,
        'advertising': false,
      },
      'pro': {
        'recording': true,
        'cloudRecording': true,
        'customBranding': true,
        'prioritySupport': true,
        'advancedFeatures': true,
        'calendarIntegration': true,
        'liveStreaming': true,
        'breakoutRooms': true,
        'meetingAnalytics': true,
        'apiAccess': true,
        'advertising': false,
      },
      'yearly': {
        'recording': true,
        'cloudRecording': true,
        'customBranding': true,
        'prioritySupport': true,
        'advancedFeatures': true,
        'calendarIntegration': true,
        'liveStreaming': true,
        'breakoutRooms': true,
        'meetingAnalytics': true,
        'apiAccess': true,
        'advertising': false,
      },
    };

    final planFeatures = featureMap[planId] ?? featureMap['free']!;
    return planFeatures[feature] ?? false;
  }

  /// Get call minutes limit for a plan
  /// Returns -1 for unlimited
  static int getCallMinutesLimit(String planId) {
    final limits = {
      'free': 120, // 2 hours
      'basic': 600, // 10 hours
      'pro': -1, // unlimited
      'yearly': -1, // unlimited
    };
    return limits[planId] ?? limits['free']!;
  }

  /// Check if plan has unlimited call minutes
  static bool hasUnlimitedMinutes(String planId) {
    return getCallMinutesLimit(planId) == -1;
  }

  /// Get plan limitations
  static Map<String, dynamic> getPlanLimitations(String planId) {
    final limitations = {
      'free': {
        'maxCallMinutes': 120,
        'maxMeetingsPerMonth': 10,
        'recording': false,
        'customBranding': false,
        'prioritySupport': false,
        'advancedFeatures': false,
        'apiAccess': false,
        'advertising': true,
      },
      'basic': {
        'maxCallMinutes': 600,
        'maxMeetingsPerMonth': 50,
        'recording': true,
        'customBranding': false,
        'prioritySupport': false,
        'advancedFeatures': false,
        'apiAccess': false,
        'advertising': false,
      },
      'pro': {
        'maxCallMinutes': -1, // unlimited
        'maxMeetingsPerMonth': -1, // unlimited
        'recording': true,
        'customBranding': true,
        'prioritySupport': true,
        'advancedFeatures': true,
        'apiAccess': true,
        'advertising': false,
      },
      'yearly': {
        'maxCallMinutes': -1, // unlimited
        'maxMeetingsPerMonth': -1, // unlimited
        'recording': true,
        'customBranding': true,
        'prioritySupport': true,
        'advancedFeatures': true,
        'apiAccess': true,
        'advertising': false,
      },
    };

    return limitations[planId] ?? limitations['free']!;
  }

  /// Check if user can perform action based on subscription
  static bool canPerformAction(Map<String, dynamic> subscription, String action) {
    if (subscription['features'] == null) {
      return false;
    }

    final features = subscription['features'] as Map<String, dynamic>?;
    if (features == null) {
      return false;
    }

    switch (action) {
      case 'record':
        return features['recording'] == true;
      case 'recordCloud':
        return features['cloudRecording'] == true;
      case 'customBranding':
        return features['customBranding'] == true;
      case 'apiAccess':
        return features['apiAccess'] == true;
      case 'calendarIntegration':
        return features['calendarIntegration'] == true;
      case 'liveStreaming':
        return features['liveStreaming'] == true;
      case 'breakoutRooms':
        return features['breakoutRooms'] == true;
      case 'meetingAnalytics':
        return features['meetingAnalytics'] == true;
      case 'advancedFeatures':
        return features['advancedFeatures'] == true;
      default:
        return true;
    }
  }

  /// Format feature name for display
  static String formatFeatureName(String feature) {
    return feature
        .replaceAllMapped(RegExp(r'([A-Z])'), (match) => ' ${match.group(0)}')
        .trim()
        .split(' ')
        .map((word) => word.isEmpty
            ? ''
            : word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ');
  }

  /// Format minutes for display
  static String formatMinutes(int minutes) {
    if (minutes == -1) return 'Unlimited';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return '${hours}h ${mins}m';
    }
    return '${mins}m';
  }
}

