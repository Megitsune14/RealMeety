import 'package:realmeety/domain/models/enums.dart';

class User {
  const User({
    required this.id,
    required this.email,
    required this.dateOfBirth,
    required this.age,
    required this.sexualOrientation,
    required this.availabilityStatus,
    required this.isIdentityVerified,
    required this.consentVersion,
    required this.createdAt,
  });

  final String id;
  final String email;
  final String dateOfBirth;
  final int age;
  final SexualOrientation sexualOrientation;
  final AvailabilityStatus availabilityStatus;
  final bool isIdentityVerified;
  final String consentVersion;
  final DateTime createdAt;

  factory User.fromJson(Map<String, dynamic> json) {
    final orientation = SexualOrientation.fromApi(json['sexualOrientation'] as String);
    final availability = AvailabilityStatus.fromApi(
      json['availabilityStatus'] as String? ?? 'unavailable',
    );
    if (orientation == null) {
      throw FormatException('Orientation invalide: ${json['sexualOrientation']}');
    }

    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      dateOfBirth: json['dateOfBirth'] as String? ?? '',
      age: json['age'] as int,
      sexualOrientation: orientation,
      availabilityStatus: availability,
      isIdentityVerified: json['isIdentityVerified'] as bool,
      consentVersion: json['consentVersion'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class AuthResponse {
  const AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final User user;
  final String accessToken;
  final String refreshToken;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }
}

class NearbyCluster {
  const NearbyCluster({
    required this.lat,
    required this.lng,
    required this.count,
    this.geohash,
  });

  final double lat;
  final double lng;
  final int count;
  final String? geohash;

  factory NearbyCluster.fromJson(Map<String, dynamic> json) {
    return NearbyCluster(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      count: json['count'] as int,
      geohash: json['geohash'] as String?,
    );
  }
}

class NearbyResponse {
  const NearbyResponse({
    required this.count,
    required this.radius,
    required this.clusters,
  });

  final int count;
  final int radius;
  final List<NearbyCluster> clusters;

  factory NearbyResponse.fromJson(Map<String, dynamic> json) {
    final clusters = (json['clusters'] as List<dynamic>)
        .map((c) => NearbyCluster.fromJson(c as Map<String, dynamic>))
        .toList();

    return NearbyResponse(
      count: json['count'] as int,
      radius: json['radius'] as int,
      clusters: clusters,
    );
  }
}

class ConsentItem {
  const ConsentItem({
    required this.type,
    required this.granted,
    required this.version,
    required this.grantedAt,
    this.revokedAt,
  });

  final String type;
  final bool granted;
  final String version;
  final DateTime grantedAt;
  final DateTime? revokedAt;

  factory ConsentItem.fromJson(Map<String, dynamic> json) {
    return ConsentItem(
      type: json['type'] as String,
      granted: json['granted'] as bool,
      version: json['version'] as String,
      grantedAt: DateTime.parse(json['grantedAt'] as String),
      revokedAt: json['revokedAt'] != null
          ? DateTime.parse(json['revokedAt'] as String)
          : null,
    );
  }
}

class LegalDocument {
  const LegalDocument({
    required this.title,
    required this.version,
    required this.sections,
  });

  final String title;
  final String version;
  final List<LegalSection> sections;

  factory LegalDocument.fromJson(Map<String, dynamic> json) {
    return LegalDocument(
      title: json['title'] as String,
      version: json['version'] as String,
      sections: (json['sections'] as List<dynamic>)
          .map((s) => LegalSection.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }
}

class LegalSection {
  const LegalSection({required this.heading, required this.body});

  final String heading;
  final String body;

  factory LegalSection.fromJson(Map<String, dynamic> json) {
    return LegalSection(
      heading: json['heading'] as String,
      body: json['body'] as String,
    );
  }
}

class IdentityStartResponse {
  const IdentityStartResponse({
    required this.provider,
    required this.sessionId,
    required this.status,
    this.url,
    this.message,
  });

  final String provider;
  final String sessionId;
  final String status;
  final String? url;
  final String? message;

  factory IdentityStartResponse.fromJson(Map<String, dynamic> json) {
    return IdentityStartResponse(
      provider: json['provider'] as String,
      sessionId: json['sessionId'] as String,
      status: json['status'] as String,
      url: json['url'] as String?,
      message: json['message'] as String?,
    );
  }
}

class IdentityStatusResponse {
  const IdentityStatusResponse({
    required this.provider,
    required this.isIdentityVerified,
    required this.status,
  });

  final String provider;
  final bool isIdentityVerified;
  final String status;

  factory IdentityStatusResponse.fromJson(Map<String, dynamic> json) {
    return IdentityStatusResponse(
      provider: json['provider'] as String,
      isIdentityVerified: json['isIdentityVerified'] as bool,
      status: json['status'] as String,
    );
  }
}

class BetaInfo {
  const BetaInfo({
    required this.enabled,
    required this.radiusMeters,
    this.message,
    this.centerLat,
    this.centerLng,
  });

  final bool enabled;
  final int radiusMeters;
  final String? message;
  final double? centerLat;
  final double? centerLng;

  factory BetaInfo.fromJson(Map<String, dynamic> json) {
    final center = json['center'] as Map<String, dynamic>?;
    return BetaInfo(
      enabled: json['enabled'] as bool,
      radiusMeters: json['radiusMeters'] as int,
      message: json['message'] as String?,
      centerLat: (center?['lat'] as num?)?.toDouble(),
      centerLng: (center?['lng'] as num?)?.toDouble(),
    );
  }
}
