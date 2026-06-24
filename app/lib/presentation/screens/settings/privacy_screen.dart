import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/domain/models/user.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class PrivacySettingsScreen extends ConsumerStatefulWidget {
  const PrivacySettingsScreen({super.key});

  @override
  ConsumerState<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends ConsumerState<PrivacySettingsScreen> {
  List<ConsentItem> _consents = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ref.read(apiClientProvider);
    final token = await ref.read(secureStorageProvider).read(key: 'access_token');
    api.setAccessToken(token);
    try {
      final consents = await api.getConsents();
      setState(() { _consents = consents; _isLoading = false; });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleConsent(ConsentType type, bool granted) async {
    final api = ref.read(apiClientProvider);
    final token = await ref.read(secureStorageProvider).read(key: 'access_token');
    api.setAccessToken(token);
    await api.updateConsent(
      type: type,
      granted: granted,
      version: type == ConsentType.geolocation
          ? AppConstants.geoConsentVersion
          : AppConstants.privacyVersion,
    );
    await _load();
  }

  Future<void> _exportData() async {
    final api = ref.read(apiClientProvider);
    final token = await ref.read(secureStorageProvider).read(key: 'access_token');
    api.setAccessToken(token);
    final data = await api.exportData();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Export généré le ${data['exportedAt']}')),
      );
    }
  }

  bool _isGranted(ConsentType type) {
    return _consents.any((c) => c.type == type.apiValue && c.granted);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confidentialité')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Gestion des consentements (RGPD)', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 16),
                _ConsentTile(
                  title: ConsentType.geolocation.label,
                  subtitle: 'Partage de position uniquement quand vous êtes disponible',
                  value: _isGranted(ConsentType.geolocation),
                  onChanged: (v) => _toggleConsent(ConsentType.geolocation, v),
                ),
                _ConsentTile(
                  title: ConsentType.marketing.label,
                  subtitle: 'Emails et notifications promotionnelles',
                  value: _isGranted(ConsentType.marketing),
                  onChanged: (v) => _toggleConsent(ConsentType.marketing, v),
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: 'Exporter mes données',
                  variant: AppButtonVariant.secondary,
                  icon: Icons.download_outlined,
                  onPressed: _exportData,
                ),
              ],
            ),
    );
  }
}

class _ConsentTile extends StatelessWidget {
  const _ConsentTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: SwitchListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        value: value,
        onChanged: onChanged,
      ),
    );
  }
}

class DeleteAccountScreen extends ConsumerStatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  ConsumerState<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends ConsumerState<DeleteAccountScreen> {
  bool _confirmed = false;
  bool _isLoading = false;

  Future<void> _delete() async {
    if (!_confirmed) return;
    setState(() => _isLoading = true);
    await ref.read(authStateProvider.notifier).deleteAccount();
    if (mounted) context.go('/welcome');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Supprimer mon compte')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.warning_amber_rounded, size: 56, color: Colors.orange),
            const SizedBox(height: 20),
            Text(
              'Droit à l\'oubli',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Cette action est irréversible. Toutes vos données seront supprimées '
              'conformément au RGPD.',
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CheckboxListTile(
              value: _confirmed,
              onChanged: (v) => setState(() => _confirmed = v ?? false),
              title: const Text('Je comprends que cette action est définitive'),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
            ),
            const Spacer(),
            AppButton(
              label: 'Supprimer définitivement',
              variant: AppButtonVariant.danger,
              isLoading: _isLoading,
              onPressed: _confirmed && !_isLoading ? _delete : null,
            ),
          ],
        ),
      ),
    );
  }
}
