// Pricing Plans Configuration for Mobile App
class PricingPlan {
  final String id;
  final String name;
  final double price;
  final String billing;
  final String description;
  final List<String> features;
  final int callMinutes;
  final int maxParticipants;
  final bool isPopular;
  final bool hasRecording;
  final bool hasCustomBranding;
  final bool hasPrioritySupport;
  final bool hasAdvancedFeatures;
  final bool hasApiAccess;
  final bool hasAdvertising;

  PricingPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.billing,
    required this.description,
    required this.features,
    required this.callMinutes,
    required this.maxParticipants,
    required this.isPopular,
    required this.hasRecording,
    required this.hasCustomBranding,
    required this.hasPrioritySupport,
    required this.hasAdvancedFeatures,
    required this.hasApiAccess,
    required this.hasAdvertising,
  });

  String get priceDisplay {
    if (price == 0) return 'Free';
    return billing == 'yearly' ? '\$$price/year' : '\$$price/month';
  }

  double get monthlyEquivalent {
    if (billing == 'yearly') return price / 12;
    return price;
  }
}

class PricingPlans {
  static final free = PricingPlan(
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'monthly',
    description: 'Perfect for trying out Montty Zoom',
    features: [
      '2 hours of call minutes per month',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Google advertising included',
      'Basic meeting features',
    ],
    callMinutes: 120,
    maxParticipants: -1, // unlimited
    isPopular: false,
    hasRecording: false,
    hasCustomBranding: false,
    hasPrioritySupport: false,
    hasAdvancedFeatures: false,
    hasApiAccess: false,
    hasAdvertising: true,
  );

  static final basic = PricingPlan(
    id: 'basic',
    name: 'Basic',
    price: 1.99,
    billing: 'monthly',
    description: 'For individuals and small teams',
    features: [
      '10 hours of call minutes per month',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Recording (local)',
      'No advertising',
      'Email support',
      'Meeting scheduling',
    ],
    callMinutes: 600,
    maxParticipants: -1, // unlimited
    isPopular: false,
    hasRecording: true,
    hasCustomBranding: false,
    hasPrioritySupport: false,
    hasAdvancedFeatures: false,
    hasApiAccess: false,
    hasAdvertising: false,
  );

  static final pro = PricingPlan(
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    billing: 'monthly',
    description: 'For large organizations with all features',
    features: [
      'Unlimited call minutes',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Cloud recording',
      'Custom branding',
      'Priority support',
      'Advanced features',
      'Calendar integration',
      'Live streaming',
      'Breakout rooms',
      'Meeting analytics',
      'Get every new update',
      'API access',
    ],
    callMinutes: -1, // unlimited
    maxParticipants: -1, // unlimited
    isPopular: true,
    hasRecording: true,
    hasCustomBranding: true,
    hasPrioritySupport: true,
    hasAdvancedFeatures: true,
    hasApiAccess: true,
    hasAdvertising: false,
  );

  static final yearly = PricingPlan(
    id: 'yearly',
    name: 'Yearly',
    price: 50,
    billing: 'yearly',
    description: 'Best value - Save 17% compared to monthly',
    features: [
      'Unlimited call minutes',
      'Unlimited participants per meeting',
      'HD video quality',
      'Screen sharing',
      'Chat messaging',
      'Cloud recording',
      'Custom branding',
      'Priority support',
      'Advanced features',
      'Calendar integration',
      'Live streaming',
      'Breakout rooms',
      'Meeting analytics',
      'Get every new update',
      'API access',
      'Same as Pro plan',
    ],
    callMinutes: -1, // unlimited
    maxParticipants: -1, // unlimited
    isPopular: false,
    hasRecording: true,
    hasCustomBranding: true,
    hasPrioritySupport: true,
    hasAdvancedFeatures: true,
    hasApiAccess: true,
    hasAdvertising: false,
  );

  static List<PricingPlan> getAllPlans({bool showYearly = false}) {
    if (showYearly) {
      return [free, basic, yearly];
    }
    return [free, basic, pro];
  }

  static PricingPlan getPlanById(String planId) {
    switch (planId) {
      case 'free':
        return free;
      case 'basic':
        return basic;
      case 'pro':
        return pro;
      case 'yearly':
        return yearly;
      default:
        return free;
    }
  }
}

