import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/data/providers/auth_provider.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/domain/models/user.dart';

final mapStateProvider = StateNotifierProvider<MapNotifier, MapState>((ref) {
  return MapNotifier(ref);
});

class MapState {
  const MapState({
    this.position,
    this.nearby,
    this.isLoading = false,
    this.error,
    this.radius = 1000,
    this.filterOrientation,
  });

  final Position? position;
  final NearbyResponse? nearby;
  final bool isLoading;
  final String? error;
  final int radius;
  final SexualOrientation? filterOrientation;

  bool get isAvailable =>
      false; // driven by user.availabilityStatus in notifier

  MapState copyWith({
    Position? position,
    NearbyResponse? nearby,
    bool? isLoading,
    String? error,
    int? radius,
    SexualOrientation? filterOrientation,
    bool clearError = false,
  }) {
    return MapState(
      position: position ?? this.position,
      nearby: nearby ?? this.nearby,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      radius: radius ?? this.radius,
      filterOrientation: filterOrientation ?? this.filterOrientation,
    );
  }
}

class MapNotifier extends StateNotifier<MapState> {
  MapNotifier(this._ref) : super(const MapState());

  final Ref _ref;

  ApiClient get _api => _ref.read(apiClientProvider);

  Future<void> _ensureToken() async {
    final token = await _ref.read(secureStorageProvider).read(key: 'access_token');
    _api.setAccessToken(token);
  }

  Future<Position?> getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      state = state.copyWith(error: 'Activez la géolocalisation sur votre appareil.');
      return null;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      state = state.copyWith(error: 'Permission de localisation refusée.');
      return null;
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    state = state.copyWith(position: position, clearError: true);
    return position;
  }

  Future<void> _ensureGeoConsent() async {
    final consents = await _api.getConsents();
    final hasGeo = consents.any(
      (c) => c.type == ConsentType.geolocation.apiValue && c.granted && c.revokedAt == null,
    );
    if (hasGeo) return;

    await _api.updateConsent(
      type: ConsentType.geolocation,
      granted: true,
      version: AppConstants.geoConsentVersion,
    );
  }

  Future<void> setAvailable(bool available) async {
    state = state.copyWith(isLoading: true, clearError: true);
    await _ensureToken();

    try {
      if (available) {
        final position = state.position ?? await getCurrentPosition();
        if (position == null) {
          state = state.copyWith(isLoading: false);
          return;
        }

        await _ensureGeoConsent();
        await _api.updateAvailability(AvailabilityStatus.available);
        try {
          await _api.updateLocation(
            lat: position.latitude,
            lng: position.longitude,
            accuracyMeters: position.accuracy,
          );
        } on ApiException {
          await _api.updateAvailability(AvailabilityStatus.unavailable);
          rethrow;
        }
        await _refreshNearby(position.latitude, position.longitude);
        await _ref.read(authStateProvider.notifier).refreshUser();
      } else {
        await _api.deleteLocation();
        final user = await _api.updateAvailability(AvailabilityStatus.unavailable);
        await _ref.read(authStateProvider.notifier).setUser(user);
        state = state.copyWith(nearby: null, isLoading: false, clearError: true);
      }
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Impossible de mettre à jour.');
    }
  }

  Future<void> _refreshNearby(double lat, double lng) async {
    final nearby = await _api.getNearby(
      lat: lat,
      lng: lng,
      radius: state.radius,
      orientation: state.filterOrientation,
    );
    state = state.copyWith(nearby: nearby, isLoading: false, clearError: true);
  }

  Future<void> refreshMap() async {
    final position = state.position ?? await getCurrentPosition();
    if (position == null) return;
    state = state.copyWith(isLoading: true);
    await _ensureToken();
    try {
      await _refreshNearby(position.latitude, position.longitude);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    }
  }

  void setRadius(int radius) {
    state = state.copyWith(radius: radius);
  }

  void setFilter(SexualOrientation? orientation) {
    state = state.copyWith(filterOrientation: orientation);
  }

  Future<void> initPosition() async {
    await getCurrentPosition();
  }
}
