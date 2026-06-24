import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class LocationConsentScreen extends ConsumerStatefulWidget {
  const LocationConsentScreen({super.key});

  @override
  ConsumerState<LocationConsentScreen> createState() => _LocationConsentScreenState();
}

class _LocationConsentScreenState extends ConsumerState<LocationConsentScreen> {
  bool _consentGranted = false;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _grantAndContinue() async {
    setState(() { _isLoading = true; _errorMessage = null; });

    try {
      final api = ref.read(apiClientProvider);
      final token = await ref.read(secureStorageProvider).read(key: 'access_token');
      api.setAccessToken(token);

      await api.updateConsent(
        type: ConsentType.geolocation,
        granted: true,
        version: AppConstants.geoConsentVersion,
      );
      await api.updateConsent(
        type: ConsentType.privacy,
        granted: true,
        version: AppConstants.privacyVersion,
      );

      if (mounted) context.go('/map');
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Erreur lors de l\'enregistrement du consentement.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Géolocalisation')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const OnboardingStepper(currentStep: 4, totalSteps: 4),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.location_on_rounded, size: 48),
              ),
              const SizedBox(height: 24),
              Text('Votre position, sous votre contrôle', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(
                'RealMeety utilise votre position uniquement lorsque vous êtes disponible. '
                'Elle est supprimée après 30 minutes ou dès que vous vous rendez indisponible.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              if (_errorMessage != null) ErrorBanner(message: _errorMessage!),
              Semantics(
                checked: _consentGranted,
                child: CheckboxListTile(
                  value: _consentGranted,
                  onChanged: (v) => setState(() => _consentGranted = v ?? false),
                  title: const Text('J\'accepte le partage de ma position quand je suis disponible'),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const Spacer(),
              AppButton(
                label: 'Continuer',
                onPressed: (_consentGranted && !_isLoading) ? _grantAndContinue : null,
                isLoading: _isLoading,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/map'),
                child: const Text('Plus tard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
