import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/domain/models/user.dart';

const _accessTokenKey = 'access_token';
const _refreshTokenKey = 'refresh_token';

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>(
  (ref) => AuthNotifier(ref),
);

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    _restoreSession();
  }

  final Ref _ref;

  ApiClient get _api => _ref.read(apiClientProvider);
  FlutterSecureStorage get _storage => _ref.read(secureStorageProvider);

  Future<void> _restoreSession() async {
    try {
      final token = await _storage.read(key: _accessTokenKey);
      final refresh = await _storage.read(key: _refreshTokenKey);
      if (token == null) {
        state = const AsyncValue.data(null);
        return;
      }
      _api.setAccessToken(token);
      try {
        final user = await _api.getMe();
        state = AsyncValue.data(user);
      } catch (_) {
        if (refresh != null) {
          final newToken = await _api.refreshAccessToken(refresh);
          await _storage.write(key: _accessTokenKey, value: newToken);
          _api.setAccessToken(newToken);
          final user = await _api.getMe();
          state = AsyncValue.data(user);
          return;
        }
        await _clearTokens();
        state = const AsyncValue.data(null);
      }
    } catch (_) {
      await _clearTokens();
      state = const AsyncValue.data(null);
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String dateOfBirth,
    required SexualOrientation orientation,
    required String consentVersion,
  }) async {
    state = const AsyncValue.loading();
    try {
      final response = await _api.register(
        email: email,
        password: password,
        dateOfBirth: dateOfBirth,
        orientation: orientation,
        consentVersion: consentVersion,
      );
      await _persistTokens(response);
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncValue.loading();
    try {
      final response = await _api.login(email: email, password: password);
      await _persistTokens(response);
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> refreshUser() async {
    try {
      final user = await _api.getMe();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> setUser(User user) async {
    state = AsyncValue.data(user);
  }

  Future<void> logout() async {
    await _api.logout();
    await _clearTokens();
    state = const AsyncValue.data(null);
  }

  Future<void> deleteAccount() async {
    await _api.deleteAccount();
    await _clearTokens();
    state = const AsyncValue.data(null);
  }

  Future<void> _persistTokens(AuthResponse response) async {
    await _storage.write(key: _accessTokenKey, value: response.accessToken);
    await _storage.write(key: _refreshTokenKey, value: response.refreshToken);
    _api.setAccessToken(response.accessToken);
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    _api.setAccessToken(null);
  }
}
