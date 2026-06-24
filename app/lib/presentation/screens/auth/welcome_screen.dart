import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/core/theme/app_theme.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(Icons.favorite_rounded, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 32),
              Semantics(
                header: true,
                child: Text(
                  AppConstants.appName,
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Rencontres réelles.\nSans profil. Sans messagerie.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 20),
              const AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _FeatureRow(icon: Icons.visibility_off_outlined, text: 'Pas de photo ni de bio'),
                    SizedBox(height: 10),
                    _FeatureRow(icon: Icons.map_outlined, text: 'Découvrez qui est disponible à proximité'),
                    SizedBox(height: 10),
                    _FeatureRow(icon: Icons.shield_outlined, text: 'Votre position, sous votre contrôle'),
                  ],
                ),
              ),
              const Spacer(flex: 3),
              AppButton(
                label: 'Créer un compte',
                onPressed: () => context.push('/register'),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Se connecter',
                variant: AppButtonVariant.secondary,
                onPressed: () => context.push('/login'),
              ),
              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
      ],
    );
  }
}
