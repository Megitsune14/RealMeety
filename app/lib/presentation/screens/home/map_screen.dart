import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:realmeety/core/theme/app_theme.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/data/providers/map_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/presentation/widgets/app_components.dart';
import 'package:realmeety/presentation/widgets/beta_banner.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  final _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(mapStateProvider.notifier).initPosition();
    });
  }

  void _showFilters() {
    final mapState = ref.read(mapStateProvider);
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Filtres', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 20),
            Text('Rayon de recherche : ${mapState.radius} m'),
            Slider(
              value: mapState.radius.toDouble(),
              min: 500,
              max: 5000,
              divisions: 9,
              label: '${mapState.radius} m',
              onChanged: (v) => ref.read(mapStateProvider.notifier).setRadius(v.round()),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<SexualOrientation?>(
              value: mapState.filterOrientation,
              decoration: const InputDecoration(labelText: 'Orientation'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Toutes')),
                ...SexualOrientation.values.map(
                  (o) => DropdownMenuItem(value: o, child: Text(o.label)),
                ),
              ],
              onChanged: (v) => ref.read(mapStateProvider.notifier).setFilter(v),
            ),
            const SizedBox(height: 20),
            AppButton(
              label: 'Appliquer',
              onPressed: () {
                Navigator.pop(ctx);
                ref.read(mapStateProvider.notifier).refreshMap();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mapState = ref.watch(mapStateProvider);
    final user = ref.watch(authStateProvider).valueOrNull;
    final isAvailable = user?.availabilityStatus == AvailabilityStatus.available;
    final center = mapState.position != null
        ? LatLng(mapState.position!.latitude, mapState.position!.longitude)
        : const LatLng(48.8566, 2.3522);

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: 15,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.realmeety.app',
              ),
              if (mapState.position != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: center,
                      width: 24,
                      height: 24,
                      child: Container(
                        decoration: BoxDecoration(
                          color: isAvailable ? AppColors.available : AppColors.unavailable,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              if (mapState.nearby != null)
                MarkerLayer(
                  markers: mapState.nearby!.clusters.map((cluster) {
                    return Marker(
                      point: LatLng(cluster.lat, cluster.lng),
                      width: 40,
                      height: 40,
                      child: _ClusterMarker(count: cluster.count),
                    );
                  }).toList(),
                ),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _TopButton(
                    icon: Icons.settings_outlined,
                    tooltip: 'Paramètres',
                    onTap: () => context.push('/settings'),
                  ),
                  const Spacer(),
                  _TopButton(
                    icon: Icons.tune,
                    tooltip: 'Filtres',
                    onTap: _showFilters,
                  ),
                  const SizedBox(width: 8),
                  _TopButton(
                    icon: Icons.refresh,
                    tooltip: 'Actualiser',
                    onTap: () => ref.read(mapStateProvider.notifier).refreshMap(),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const BetaBanner(),
                const SizedBox(height: 8),
                StatusBadge(
                  isAvailable: isAvailable,
                  count: mapState.nearby?.count ?? 0,
                ),
              ],
            ),
          ),
          if (mapState.error != null)
            Positioned(
              bottom: 120,
              left: 16,
              right: 16,
              child: ErrorBanner(message: mapState.error!),
            ),
          if (!isAvailable && mapState.nearby?.count == 0)
            const Positioned.fill(
              child: IgnorePointer(
                child: Center(
                  child: EmptyState(
                    icon: Icons.people_outline,
                    title: 'Personne à proximité',
                    subtitle: 'Activez votre disponibilité pour apparaître sur la carte.',
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 32,
            left: 24,
            right: 24,
            child: AppButton(
              label: isAvailable ? 'Je ne suis plus disponible' : 'Je suis disponible',
              icon: isAvailable ? Icons.visibility_off : Icons.visibility,
              variant: isAvailable ? AppButtonVariant.danger : AppButtonVariant.primary,
              isLoading: mapState.isLoading,
              onPressed: mapState.isLoading
                  ? null
                  : () => ref.read(mapStateProvider.notifier).setAvailable(!isAvailable),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClusterMarker extends StatelessWidget {
  const _ClusterMarker({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.accent,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(color: AppColors.accent.withValues(alpha: 0.4), blurRadius: 8),
        ],
      ),
      child: Center(
        child: Text(
          '$count',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ),
    );
  }
}

class _TopButton extends StatelessWidget {
  const _TopButton({required this.icon, required this.tooltip, required this.onTap});

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: tooltip,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        elevation: 2,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(icon, size: 22, color: AppColors.onSurface),
          ),
        ),
      ),
    );
  }
}
