import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../utils/pricing_plans.dart';
import '../utils/subscription_features.dart';
import '../services/subscription_service.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  Map<String, dynamic>? subscription;
  List<Map<String, dynamic>> billingHistory = [];
  bool isLoading = true;
  bool showCancelModal = false;
  final SubscriptionService _subscriptionService = SubscriptionService();
  final String userId = 'user-placeholder'; // Replace with actual userId from state management
  
  @override
  void initState() {
    super.initState();
    loadSubscription();
    loadBillingHistory();
  }

  Future<void> loadSubscription() async {
    try {
      final result = await _subscriptionService.getUserSubscription(userId);
      
      if (result != null) {
        setState(() {
          subscription = result;
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to load subscription')),
          );
        }
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> loadBillingHistory() async {
    try {
      final response = await http.get(
        Uri.parse('${_subscriptionService.apiUrl}/api/subscription/billing-history?userId=$userId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          billingHistory = List<Map<String, dynamic>>.from(data['history'] ?? []);
        });
      }
    } catch (e) {
      // Silently fail - billing history is optional
    }
  }

  Future<void> cancelSubscription() async {
    try {
      final success = await _subscriptionService.cancelSubscription(userId);

      if (success) {
        setState(() {
          showCancelModal = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Subscription cancelled successfully')),
          );
        }
        loadSubscription();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to cancel subscription')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  PricingPlan getPlanDetails(String planId) {
    return PricingPlans.getPlanById(planId);
  }

  String formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return 'N/A';
    }
  }

  String formatMinutes(int minutes) {
    return SubscriptionFeatures.formatMinutes(minutes);
  }

  double getUsagePercentage() {
    if (subscription == null) return 0;
    final callMinutes = subscription!['callMinutes'] as int;
    if (callMinutes == -1 || callMinutes == 0) return 0;
    final used = subscription!['callMinutesUsed'] as int;
    return (used / callMinutes) * 100;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription & Billing'),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : subscription == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No Subscription Found',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('Start with our free plan!'),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/pricing'),
                        child: const Text('View Plans'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Current Plan Card
                      _buildCurrentPlanCard(),
                      const SizedBox(height: 16),
                      // Features Card
                      _buildFeaturesCard(),
                      const SizedBox(height: 16),
                      // Billing History
                      _buildBillingHistoryCard(),
                      const SizedBox(height: 16),
                      // Actions
                      _buildActions(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildCurrentPlanCard() {
    final planId = subscription!['planId'] as String;
    final planDetails = getPlanDetails(planId);
    final status = subscription!['status'] as String;
    final usagePercentage = getUsagePercentage();

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF667eea), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: status == 'active'
                        ? Colors.green.withOpacity(0.2)
                        : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: status == 'active' ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/pricing'),
                  child: const Text('Change Plan'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              planDetails.name,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subscription!['planId'] == 'free'
                  ? 'Free'
                  : '\$${planDetails.price}/month',
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Color(0xFF667eea),
              ),
            ),
            const SizedBox(height: 16),
            // Usage Stats
            _buildUsageStats(usagePercentage),
          ],
        ),
      ),
    );
  }

  Widget _buildUsageStats(double usagePercentage) {
    final callMinutes = subscription!['callMinutes'] as int;
    final used = subscription!['callMinutesUsed'] as int;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Call Minutes',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                Text(
                  callMinutes == -1
                      ? 'Unlimited'
                      : '${SubscriptionFeatures.formatMinutes(used)} / ${SubscriptionFeatures.formatMinutes(callMinutes)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Max Participants',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                Text(
                  subscription!['maxParticipants'] == -1
                      ? 'Unlimited'
                      : '${subscription!['maxParticipants']}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
        if (callMinutes != -1) ...[
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: usagePercentage / 100,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
          ),
        ],
      ],
    );
  }

  Widget _buildFeaturesCard() {
    final features = subscription!['features'] as Map<String, dynamic>? ?? {};

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Plan Features',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...features.entries.map((entry) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Icon(
                        entry.value == true
                            ? Icons.check_circle
                            : Icons.cancel,
                        color: entry.value == true ? Colors.green : Colors.grey,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          SubscriptionFeatures.formatFeatureName(entry.key),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingHistoryCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Billing History',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (billingHistory.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'No billing history available',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              ...billingHistory.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['description'] ?? 'Subscription',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                formatDate(item['date']?.toString()),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '\$${item['amount']?.toStringAsFixed(2) ?? '0.00'}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }

  Widget _buildActions() {
    final planId = subscription!['planId'] as String;
    final status = subscription!['status'] as String;

    return Column(
      children: [
        if (planId == 'free')
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/pricing'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF667eea),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Upgrade to Premium',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        if (planId != 'free' && status == 'active') ...[
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Cancel Subscription'),
                    content: const Text(
                      'Are you sure you want to cancel your subscription? Your plan will remain active until the end of the billing period.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Keep Subscription'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          cancelSubscription();
                        },
                        style: TextButton.styleFrom(foregroundColor: Colors.red),
                        child: const Text('Cancel Subscription'),
                      ),
                    ],
                  ),
                );
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Cancel Subscription',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

