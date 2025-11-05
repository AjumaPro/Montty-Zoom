import 'package:flutter/material.dart';
import '../services/subscription_service.dart';
import '../utils/subscription_features.dart';

/// Widget to check and display feature availability
class FeatureCheckWidget extends StatelessWidget {
  final String userId;
  final String action;
  final Widget Function(BuildContext context, bool hasFeature) builder;
  final Widget? fallback;

  const FeatureCheckWidget({
    super.key,
    required this.userId,
    required this.action,
    required this.builder,
    this.fallback,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: SubscriptionService().checkFeature(userId, action),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }

        final hasFeature = snapshot.data ?? false;

        if (hasFeature) {
          return builder(context, true);
        }

        return fallback ?? const SizedBox.shrink();
      },
    );
  }
}

/// Helper widget to show upgrade prompt when feature is not available
class UpgradePromptWidget extends StatelessWidget {
  final String featureName;
  final String planName;

  const UpgradePromptWidget({
    super.key,
    required this.featureName,
    this.planName = 'Pro',
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      color: Colors.orange.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lock_outline, color: Colors.orange.shade700),
                const SizedBox(width: 8),
                Text(
                  'Premium Feature',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '$featureName is only available in the $planName plan.',
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/pricing');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF667eea),
                ),
                child: const Text('Upgrade Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Widget to check call minutes before action
class CallMinutesCheckWidget extends StatelessWidget {
  final String userId;
  final int requiredMinutes;
  final Widget Function(BuildContext context, bool allowed, int remaining) builder;
  final Widget? insufficientMinutesWidget;

  const CallMinutesCheckWidget({
    super.key,
    required this.userId,
    required this.requiredMinutes,
    required this.builder,
    this.insufficientMinutesWidget,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: SubscriptionService().checkCallMinutes(userId, requiredMinutes),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final result = snapshot.data ?? {'allowed': false, 'remaining': 0};
        final allowed = result['allowed'] == true;
        final remaining = result['remaining'] as int? ?? 0;

        if (!allowed && insufficientMinutesWidget != null) {
          return insufficientMinutesWidget!;
        }

        return builder(context, allowed, remaining);
      },
    );
  }
}

