import 'package:http/http.dart' as http;
import 'dart:convert';

class SubscriptionService {
  final String apiUrl;

  SubscriptionService({String? apiUrl})
      : apiUrl = apiUrl ?? 'http://localhost:5000';

  /// Get user subscription
  Future<Map<String, dynamic>?> getUserSubscription(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$apiUrl/api/subscription?userId=$userId'),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Error getting subscription: $e');
      return null;
    }
  }

  /// Check if user can perform action
  Future<bool> checkFeature(String userId, String action) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/subscription/check-feature'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId, 'action': action}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return data['allowed'] == true;
      }
      return false;
    } catch (e) {
      print('Error checking feature: $e');
      return false;
    }
  }

  /// Check call minutes limit
  Future<Map<String, dynamic>> checkCallMinutes(
      String userId, int requiredMinutes) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/subscription/check-minutes'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'requiredMinutes': requiredMinutes,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return {
        'allowed': false,
        'remaining': 0,
        'message': 'Failed to check minutes'
      };
    } catch (e) {
      print('Error checking minutes: $e');
      return {
        'allowed': false,
        'remaining': 0,
        'message': 'Error checking minutes'
      };
    }
  }

  /// Track call minutes usage
  Future<Map<String, dynamic>> trackCallMinutes(
      String userId, int minutes) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/subscription/track-usage'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'minutes': minutes,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return {'allowed': false, 'remaining': 0};
    } catch (e) {
      print('Error tracking minutes: $e');
      return {'allowed': false, 'remaining': 0};
    }
  }

  /// Activate free plan
  Future<bool> activateFreePlan(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/subscription/activate-free'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error activating free plan: $e');
      return false;
    }
  }

  /// Cancel subscription
  Future<bool> cancelSubscription(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/subscription/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error cancelling subscription: $e');
      return false;
    }
  }
}

