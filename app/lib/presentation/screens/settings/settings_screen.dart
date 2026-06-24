import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/core/theme/app_theme.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Retour',
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user != null)
            AppCard(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                    child: const Icon(Icons.person, color: AppColors.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.email, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          '${user.age} ans · ${user.sexualOrientation.label}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.availabilityStatus.label,
                          style: TextStyle(
                            color: user.availabilityStatus.name == 'available'
                                ? AppColors.available
                                : AppColors.onSurfaceMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          _SettingsTile(
            icon: Icons.edit_outlined,
            title: 'Modifier mon profil',
            subtitle: 'Âge et orientation uniquement',
            onTap: () => context.push('/edit-profile'),
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Confidentialité & consentements',
            subtitle: 'RGPD, géolocalisation',
            onTap: () => context.push('/privacy'),
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'CGU',
            onTap: () => context.push('/legal/terms'),
          ),
          _SettingsTile(
            icon: Icons.policy_outlined,
            title: 'Politique de confidentialité',
            onTap: () => context.push('/legal/privacy'),
          ),
          const Divider(height: 32),
          _SettingsTile(
            icon: Icons.logout,
            title: 'Se déconnecter',
            color: AppColors.error,
            onTap: () async {
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) context.go('/welcome');
            },
          ),
          _SettingsTile(
            icon: Icons.delete_forever_outlined,
            title: 'Supprimer mon compte',
            subtitle: 'Droit à l\'oubli (RGPD)',
            color: AppColors.error,
            onTap: () => context.push('/delete-account'),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.color,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: color ?? AppColors.primary),
        title: Text(title, style: TextStyle(color: color)),
        subtitle: subtitle != null ? Text(subtitle!) : null,
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
