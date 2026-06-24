import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/presentation/screens/auth/login_screen.dart';
import 'package:realmeety/presentation/screens/auth/register_screen.dart';
import 'package:realmeety/presentation/screens/auth/welcome_screen.dart';
import 'package:realmeety/presentation/screens/home/map_screen.dart';
import 'package:realmeety/presentation/screens/legal/legal_screen.dart';
import 'package:realmeety/presentation/screens/onboarding/identity_screen.dart';
import 'package:realmeety/presentation/screens/onboarding/location_consent_screen.dart';
import 'package:realmeety/presentation/screens/settings/edit_profile_screen.dart';
import 'package:realmeety/presentation/screens/settings/privacy_screen.dart';
import 'package:realmeety/presentation/screens/settings/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/welcome',
    refreshListenable: _AuthRefreshListenable(ref),
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final user = authState.valueOrNull;
      final path = state.matchedLocation;

      final isAuthRoute = path.startsWith('/welcome') ||
          path.startsWith('/login') ||
          path.startsWith('/register');

      final isLegalRoute = path.startsWith('/legal');

      if (isLoading) return null;

      if (user == null) {
        return (isAuthRoute || isLegalRoute) ? null : '/welcome';
      }

      if (!user.isIdentityVerified && path != '/identity') {
        return '/identity';
      }

      if (user.isIdentityVerified && isAuthRoute) {
        return '/map';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/identity', builder: (_, __) => const IdentityScreen()),
      GoRoute(path: '/location-consent', builder: (_, __) => const LocationConsentScreen()),
      GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/edit-profile', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/privacy', builder: (_, __) => const PrivacySettingsScreen()),
      GoRoute(path: '/delete-account', builder: (_, __) => const DeleteAccountScreen()),
      GoRoute(
        path: '/legal/:type',
        builder: (_, state) => LegalScreen(type: state.pathParameters['type']!),
      ),
    ],
  );
});

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(this._ref) {
    _ref.listen(authStateProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}
