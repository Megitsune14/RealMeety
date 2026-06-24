import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  DateTime? _dateOfBirth;
  SexualOrientation? _orientation;
  bool _termsAccepted = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 25),
      firstDate: DateTime(now.year - 120),
      lastDate: DateTime(now.year - AppConstants.minAge, now.month, now.day),
      helpText: 'Date de naissance',
      locale: const Locale('fr', 'FR'),
    );
    if (picked != null) setState(() => _dateOfBirth = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dateOfBirth == null) {
      setState(() => _errorMessage = 'Veuillez indiquer votre date de naissance.');
      return;
    }
    if (_orientation == null) {
      setState(() => _errorMessage = 'Veuillez sélectionner une orientation.');
      return;
    }
    if (!_termsAccepted) {
      setState(() => _errorMessage = 'Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    setState(() { _isLoading = true; _errorMessage = null; });

    try {
      final dob = DateFormat('yyyy-MM-dd').format(_dateOfBirth!);
      await ref.read(authStateProvider.notifier).register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        dateOfBirth: dob,
        orientation: _orientation!,
        consentVersion: AppConstants.termsVersion,
      );
      if (mounted) context.go('/identity');
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Une erreur est survenue.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inscription'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Retour',
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const OnboardingStepper(currentStep: 1, totalSteps: 4),
                const SizedBox(height: 24),
                Text('Données minimales', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  'Aucune photo, bio ou centre d\'intérêt.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 20),
                if (_errorMessage != null) ...[
                  ErrorBanner(message: _errorMessage!),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Email requis';
                    if (!v.contains('@')) return 'Email invalide';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _passwordController,
                  label: 'Mot de passe',
                  obscure: true,
                  helper: 'Minimum 8 caractères',
                  validator: (v) => (v == null || v.length < 8) ? 'Minimum 8 caractères' : null,
                ),
                const SizedBox(height: 16),
                Semantics(
                  button: true,
                  label: 'Choisir date de naissance',
                  child: InkWell(
                    onTap: _pickDate,
                    borderRadius: BorderRadius.circular(16),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de naissance',
                        helperText: 'Vous devez avoir 18 ans ou plus',
                        border: OutlineInputBorder(),
                      ),
                      child: Text(
                        _dateOfBirth != null
                            ? DateFormat('d MMMM yyyy', 'fr_FR').format(_dateOfBirth!)
                            : 'Appuyez pour choisir',
                        style: TextStyle(
                          color: _dateOfBirth != null
                              ? Theme.of(context).colorScheme.onSurface
                              : Theme.of(context).hintColor,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<SexualOrientation>(
                  value: _orientation,
                  decoration: const InputDecoration(labelText: 'Orientation'),
                  borderRadius: BorderRadius.circular(16),
                  items: SexualOrientation.values
                      .map((o) => DropdownMenuItem(value: o, child: Text(o.label)))
                      .toList(),
                  onChanged: (v) => setState(() => _orientation = v),
                  validator: (v) => v == null ? 'Orientation requise' : null,
                ),
                const SizedBox(height: 8),
                Semantics(
                  checked: _termsAccepted,
                  child: CheckboxListTile(
                    value: _termsAccepted,
                    onChanged: (v) => setState(() => _termsAccepted = v ?? false),
                    title: GestureDetector(
                      onTap: () => context.push('/legal/terms'),
                      child: const Text('J\'accepte les CGU et la politique de confidentialité'),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const SizedBox(height: 24),
                AppButton(label: 'Créer mon compte', onPressed: _submit, isLoading: _isLoading),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
