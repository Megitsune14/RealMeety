import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:realmeety/core/theme/app_theme.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/domain/models/user.dart';

final betaInfoProvider = FutureProvider<BetaInfo>((ref) async {
  return ref.read(apiClientProvider).getBetaInfo();
});

class BetaBanner extends ConsumerWidget {
  const BetaBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final betaAsync = ref.watch(betaInfoProvider);

    return betaAsync.when(
      data: (info) {
        if (!info.enabled) return const SizedBox.shrink();
        return Semantics(
          label: 'Bannière beta : ${info.message}',
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.science_outlined, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    info.message ?? 'Beta terrain active',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
