import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/pricing_screen.dart';
import 'screens/subscription_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Montty Zoom',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF667eea),
          brightness: Brightness.light,
        ),
      ),
      home: const HomeScreen(),
      routes: {
        '/pricing': (context) => const PricingScreen(),
        '/subscription': (context) => const SubscriptionScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

