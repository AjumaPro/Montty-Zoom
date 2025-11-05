import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../utils/pricing_plans.dart';

const String API_URL = 'http://localhost:5000';

class PricingScreen extends StatefulWidget {
  const PricingScreen({Key? key}) : super(key: key);

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  bool _isYearly = false;
  final Map<String, bool> _loadingStates = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Your Plan'),
        backgroundColor: const Color(0xFF667eea),
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF667eea),
              Color(0xFF764ba2),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text(
                        'Choose Your Plan',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Start free, upgrade as you grow',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Billing Toggle
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Monthly',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: _isYearly ? FontWeight.normal : FontWeight.bold,
                              color: _isYearly ? Colors.white70 : Colors.white,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Switch(
                            value: _isYearly,
                            onChanged: (value) {
                              setState(() {
                                _isYearly = value;
                              });
                            },
                            activeColor: Colors.green,
                          ),
                          const SizedBox(width: 16),
                          Row(
                            children: [
                              Text(
                                'Yearly',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: _isYearly ? FontWeight.bold : FontWeight.normal,
                                  color: _isYearly ? Colors.white : Colors.white70,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Save 17%',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Pricing Cards
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: _buildPricingCards(),
                ),
                const SizedBox(height: 32),
                // Feature Comparison
                _buildFeatureComparison(),
                const SizedBox(height: 32),
                // FAQ Section
                _buildFAQSection(),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPricingCards() {
    final plans = PricingPlans.getAllPlans(showYearly: _isYearly);
    
    return Column(
      children: plans.map((plan) => _buildPricingCard(plan)).toList(),
    );
  }

  Widget _buildPricingCard(PricingPlan plan) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: plan.isPopular
            ? Border.all(color: Colors.green, width: 3)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (plan.isPopular)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: const Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.star, color: Colors.white, size: 16),
                    SizedBox(width: 4),
                    Text(
                      'Most Popular',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                Text(
                  plan.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1f2937),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (plan.id == 'yearly') ...[
                      Text(
                        '\$${plan.monthlyEquivalent.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF667eea),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text(
                          '/month',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ] else ...[
                      Text(
                        plan.price == 0 ? 'Free' : '\$${plan.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF667eea),
                        ),
                      ),
                      if (plan.price > 0)
                        const Padding(
                          padding: EdgeInsets.only(top: 8),
                          child: Text(
                            '/month',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                    ],
                  ],
                ),
                if (plan.id == 'yearly')
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Billed \$${plan.price}/year',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  plan.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                // Features List
                ...plan.features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          feature,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
                const SizedBox(height: 24),
                // Subscribe Button
                ElevatedButton(
                  onPressed: _loadingStates[plan.id] == true
                      ? null
                      : () => _handleSubscribe(plan),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: plan.isPopular
                        ? const Color(0xFF667eea)
                        : const Color(0xFFf3f4f6),
                    foregroundColor: plan.isPopular
                        ? Colors.white
                        : const Color(0xFF374151),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: plan.isPopular ? 4 : 0,
                  ),
                  child: _loadingStates[plan.id] == true
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          plan.price == 0 ? 'Get Started' : 'Subscribe',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureComparison() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Compare Plans',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1f2937),
            ),
          ),
          const SizedBox(height: 24),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: _buildComparisonTable(),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonTable() {
    final comparisonData = [
      {'feature': 'Call Minutes', 'free': '2 hours', 'basic': '10 hours', 'pro': 'Unlimited', 'yearly': 'Unlimited'},
      {'feature': 'Max Participants', 'free': '5', 'basic': '20', 'pro': '100', 'yearly': '100'},
      {'feature': 'Video Quality', 'free': 'HD', 'basic': 'HD', 'pro': 'HD', 'yearly': 'HD'},
      {'feature': 'Screen Sharing', 'free': '✓', 'basic': '✓', 'pro': '✓', 'yearly': '✓'},
      {'feature': 'Recording', 'free': '✗', 'basic': 'Local', 'pro': 'Cloud', 'yearly': 'Cloud'},
      {'feature': 'Custom Branding', 'free': '✗', 'basic': '✗', 'pro': '✓', 'yearly': '✓'},
      {'feature': 'Calendar Integration', 'free': '✗', 'basic': '✗', 'pro': '✓', 'yearly': '✓'},
      {'feature': 'Live Streaming', 'free': '✗', 'basic': '✗', 'pro': '✓', 'yearly': '✓'},
      {'feature': 'Support', 'free': 'Community', 'basic': 'Email', 'pro': 'Priority', 'yearly': 'Priority'},
      {'feature': 'Advertising', 'free': 'Google Ads', 'basic': 'No ads', 'pro': 'No ads', 'yearly': 'No ads'},
    ];

    return DataTable(
      headingRowColor: MaterialStateProperty.all(const Color(0xFFf9fafb)),
      columns: const [
        DataColumn(label: Text('Feature', style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(label: Text('Free')),
        DataColumn(label: Text('Basic')),
        DataColumn(label: Text('Pro')),
        DataColumn(label: Text('Yearly')),
      ],
      rows: comparisonData.map((row) => DataRow(
        cells: [
          DataCell(Text(row['feature']!, style: const TextStyle(fontWeight: FontWeight.w600))),
          DataCell(Text(row['free']!)),
          DataCell(Text(row['basic']!)),
          DataCell(Text(row['pro']!)),
          DataCell(Text(row['yearly']!)),
        ],
      )).toList(),
    );
  }

  Widget _buildFAQSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          _buildFAQItem(
            'Can I change plans later?',
            'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you\'ll be billed proportionally.',
          ),
          _buildFAQItem(
            'What happens to unused call minutes?',
            'Call minutes reset monthly. Unused minutes don\'t roll over to the next month.',
          ),
          _buildFAQItem(
            'Do you offer refunds?',
            'Yes, we offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.',
          ),
          _buildFAQItem(
            'What payment methods do you accept?',
            'We accept all major credit cards, debit cards, and PayPal through our secure payment processor.',
          ),
          _buildFAQItem(
            'Can I cancel anytime?',
            'Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your billing period.',
          ),
        ],
      ),
    );
  }

  Widget _buildFAQItem(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              question,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              answer,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubscribe(PricingPlan plan) async {
    setState(() {
      _loadingStates[plan.id] = true;
    });

    try {
      // Check if user is authenticated
      final prefs = await SharedPreferences.getInstance();
      final isAuthenticated = prefs.getBool('isAuthenticated') ?? false;

      if (!isAuthenticated) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please sign in to subscribe'),
            backgroundColor: Colors.red,
          ),
        );
        // Navigate to sign in
        Navigator.pushNamed(context, '/signin');
        return;
      }

      if (plan.id == 'free') {
        // Activate free plan
        final userId = prefs.getString('userId');
        if (userId == null) {
          throw Exception('User ID not found');
        }

        final response = await http.post(
          Uri.parse('$API_URL/api/subscription/activate-free'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'userId': userId}),
        );

        if (response.statusCode == 200) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Free plan activated!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else {
          throw Exception('Failed to activate free plan');
        }
      } else {
        // Paid plans - redirect to checkout
        final userId = prefs.getString('userId');
        if (userId == null) {
          throw Exception('User ID not found');
        }

        final planId = _isYearly && plan.id == 'pro' ? 'yearly' : plan.id;
        
        final response = await http.post(
          Uri.parse('$API_URL/api/subscription/create-checkout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'planId': planId,
            'billingCycle': plan.billing,
            'userId': userId,
          }),
        );

        if (response.statusCode == 200) {
          // TODO: Open Stripe checkout or payment screen
          // For now, show message
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Redirecting to checkout...'),
              backgroundColor: Colors.blue,
            ),
          );
        } else {
          throw Exception('Failed to create checkout session');
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _loadingStates[plan.id] = false;
      });
    }
  }
}

