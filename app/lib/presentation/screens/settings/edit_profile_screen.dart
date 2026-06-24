import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  DateTime? _dateOfBirth;
  SexualOrientation? _orientation;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authStateProvider).valueOrNull;
      if (user != null) {
        setState(() {
          _orientation = user.sexualOrientation;
          if (user.dateOfBirth.isNotEmpty) {
            _dateOfBirth = DateTime.tryParse(user.dateOfBirth);
          }
        });
      }
    });
  }

  Future<void> _save() async {
    if (_orientation == null) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      final api = ref.read(apiClientProvider);
      final token = await ref.read(secureStorageProvider).read(key: 'access_token');
      api.setAccessToken(token);

      final user = await api.updateProfile(
        dateOfBirth: _dateOfBirth != null
            ? DateFormat('yyyy-MM-dd').format(_dateOfBirth!)
            : null,
        orientation: _orientation,
      );
      await ref.read(authStateProvider.notifier).setUser(user);
      if (mounted) context.pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil minimal')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Seuls l\'âge et l\'orientation peuvent être modifiés. Pas de photo ni de bio.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 20),
            if (_error != null) ...[ErrorBanner(message: _error!), const SizedBox(height: 16)],
            DropdownButtonFormField<SexualOrientation>(
              value: _orientation,
              decoration: const InputDecoration(labelText: 'Orientation'),
              items: SexualOrientation.values
                  .map((o) => DropdownMenuItem(value: o, child: Text(o.label)))
                  .toList(),
              onChanged: (v) => setState(() => _orientation = v),
            ),
            const Spacer(),
            AppButton(label: 'Enregistrer', onPressed: _save, isLoading: _isLoading),
          ],
        ),
      ),
    );
  }
}
