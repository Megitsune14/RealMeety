import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class IdentityScreen extends ConsumerStatefulWidget {
  const IdentityScreen({super.key});

  @override
  ConsumerState<IdentityScreen> createState() => _IdentityScreenState();
}

class _IdentityScreenState extends ConsumerState<IdentityScreen> {
  bool _isLoading = false;
  bool _isPolling = false;
  String? _errorMessage;
  String? _provider;
  Timer? _pollTimer;

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _ensureApi() async {
    final api = ref.read(apiClientProvider);
    final token = await ref.read(secureStorageProvider).read(key: 'access_token');
    api.setAccessToken(token);
  }

  Future<void> _startVerification() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    await _ensureApi();

    try {
      final session = await ref.read(apiClientProvider).startIdentityVerification();
      setState(() => _provider = session.provider);

      if (session.provider == 'stripe' && session.url != null) {
        final uri = Uri.parse(session.url!);
        if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
          setState(() => _errorMessage = 'Impossible d\'ouvrir la page de vérification.');
          return;
        }
        _startPolling();
      } else {
        final user = await ref.read(apiClientProvider).verifyIdentityMock();
        await ref.read(authStateProvider.notifier).setUser(user);
        if (mounted) context.go('/location-consent');
      }
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'La vérification a échoué.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _startPolling() {
    setState(() => _isPolling = true);
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkStatus());
  }

  Future<void> _checkStatus() async {
    try {
      await _ensureApi();
      final status = await ref.read(apiClientProvider).getIdentityStatus();
      if (status.isIdentityVerified) {
        _pollTimer?.cancel();
        await ref.read(authStateProvider.notifier).refreshUser();
        if (mounted) {
          setState(() => _isPolling = false);
          context.go('/location-consent');
        }
      }
    } catch (_) {
      // Continue polling
    }
  }

  @override
  Widget build(BuildContext context) {
    final isStripe = _provider == 'stripe';

    return Scaffold(
      appBar: AppBar(title: const Text('Vérification d\'identité')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const OnboardingStepper(currentStep: 2, totalSteps: 4),
              const SizedBox(height: 32),
              const Icon(Icons.verified_user_outlined, size: 64),
              const SizedBox(height: 24),
              Text('Vérification obligatoire', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(
                isStripe
                    ? 'Vous allez être redirigé vers Stripe Identity pour vérifier '
                      'votre pièce d\'identité. Aucune photo de profil n\'est conservée.'
                    : 'Pour garantir la sécurité de tous, nous vérifions que vous êtes majeur·e.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              if (_isPolling) ...[
                const SizedBox(height: 24),
                const AppCard(
                  child: Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                      SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          'Vérification en cours… Revenez ici une fois terminé.',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                ErrorBanner(message: _errorMessage!),
              ],
              const Spacer(),
              if (_isPolling)
                AppButton(
                  label: 'J\'ai terminé la vérification',
                  onPressed: _checkStatus,
                )
              else
                AppButton(
                  label: isStripe ? 'Continuer avec Stripe Identity' : 'Vérifier mon identité',
                  icon: Icons.fingerprint,
                  onPressed: _isLoading ? null : _startVerification,
                  isLoading: _isLoading,
                ),
              if (isStripe) ...[
                const SizedBox(height: 12),
                Text(
                  'Propulsé par Stripe Identity — conforme RGPD',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
