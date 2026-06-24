import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:realmeety/core/constants.dart';
import 'package:realmeety/domain/models/enums.dart';
import 'package:realmeety/domain/models/user.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.details});

  final String message;
  final int? statusCode;
  final Map<String, dynamic>? details;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: AppConstants.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));

  final Dio _dio;
  String? _accessToken;

  void setAccessToken(String? token) => _accessToken = token;

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String dateOfBirth,
    required SexualOrientation orientation,
    required String consentVersion,
  }) async {
    return _postAuth('/auth/register', {
      'email': email,
      'password': password,
      'dateOfBirth': dateOfBirth,
      'sexualOrientation': orientation.apiValue,
      'consentVersion': consentVersion,
    });
  }

  Future<AuthResponse> login({required String email, required String password}) async {
    return _postAuth('/auth/login', {'email': email, 'password': password});
  }

  Future<String> refreshAccessToken(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    return response.data!['accessToken'] as String;
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout', options: _authOptions());
    } catch (_) {}
  }

  Future<User> getMe() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/users/me', options: _authOptions()),
    );
    return User.fromJson(response.data!['user'] as Map<String, dynamic>);
  }

  Future<User> updateProfile({
    String? dateOfBirth,
    SexualOrientation? orientation,
  }) async {
    final response = await _request(
      () => _dio.patch<Map<String, dynamic>>(
        '/users/me',
        data: {
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
          if (orientation != null) 'sexualOrientation': orientation.apiValue,
        },
        options: _authOptions(),
      ),
    );
    return User.fromJson(response.data!['user'] as Map<String, dynamic>);
  }

  Future<User> updateAvailability(AvailabilityStatus status) async {
    final response = await _request(
      () => _dio.patch<Map<String, dynamic>>(
        '/users/me/availability',
        data: {'status': status.apiValue},
        options: _authOptions(),
      ),
    );
    return User.fromJson(response.data!['user'] as Map<String, dynamic>);
  }

  Future<IdentityStartResponse> startIdentityVerification() async {
    final response = await _request(
      () => _dio.post<Map<String, dynamic>>('/identity/start', options: _authOptions()),
    );
    return IdentityStartResponse.fromJson(response.data!);
  }

  Future<IdentityStatusResponse> getIdentityStatus() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/identity/status', options: _authOptions()),
    );
    return IdentityStatusResponse.fromJson(response.data!);
  }

  Future<User> verifyIdentityMock() async {
    final response = await _request(
      () => _dio.post<Map<String, dynamic>>('/identity/verify', options: _authOptions()),
    );
    return User.fromJson(response.data!['user'] as Map<String, dynamic>);
  }

  Future<BetaInfo> getBetaInfo() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/beta/info'),
    );
    return BetaInfo.fromJson(response.data!);
  }

  Future<User> verifyIdentity() async => verifyIdentityMock();

  Future<void> updateConsent({
    required ConsentType type,
    required bool granted,
    required String version,
  }) async {
    await _request(
      () => _dio.post(
        '/consent',
        data: {'type': type.apiValue, 'granted': granted, 'version': version},
        options: _authOptions(),
      ),
    );
  }

  Future<List<ConsentItem>> getConsents() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/consent/status', options: _authOptions()),
    );
    return (response.data!['consents'] as List<dynamic>)
        .map((c) => ConsentItem.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  Future<void> updateLocation({
    required double lat,
    required double lng,
    double accuracyMeters = 50,
  }) async {
    await _request(
      () => _dio.put(
        '/location',
        data: {'lat': lat, 'lng': lng, 'accuracyMeters': accuracyMeters},
        options: _authOptions(),
      ),
    );
  }

  Future<void> deleteLocation() async {
    await _request(() => _dio.delete('/location', options: _authOptions()));
  }

  Future<NearbyResponse> getNearby({
    required double lat,
    required double lng,
    int radius = 1000,
    SexualOrientation? orientation,
  }) async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>(
        '/map/nearby',
        queryParameters: {
          'lat': lat,
          'lng': lng,
          'radius': radius,
          if (orientation != null) 'orientation': orientation.apiValue,
        },
        options: _authOptions(),
      ),
    );
    return NearbyResponse.fromJson(response.data!);
  }

  Future<Map<String, dynamic>> exportData() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/gdpr/export', options: _authOptions()),
    );
    return response.data!;
  }

  Future<void> deleteAccount() async {
    await _request(() => _dio.delete('/gdpr/account', options: _authOptions()));
  }

  Future<LegalDocument> getLegalDocument(String type) async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>('/legal/$type'),
    );
    return LegalDocument.fromJson(response.data!);
  }

  Future<AuthResponse> _postAuth(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: body);
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Options _authOptions() {
    if (_accessToken == null) throw ApiException('Non authentifié');
    return Options(headers: {'Authorization': 'Bearer $_accessToken'});
  }

  Future<Response<T>> _request<T>(Future<Response<T>> Function() call) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  ApiException _mapError(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic> && data['error'] is String) {
      return ApiException(
        data['error'] as String,
        statusCode: e.response?.statusCode,
        details: data['details'] as Map<String, dynamic>?,
      );
    }
    return ApiException('Erreur réseau. Vérifiez votre connexion.');
  }
}
