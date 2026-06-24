class AppConstants {
  static const appName = 'RealMeety';
  static const minAge = 18;
  static const maxAge = 120;
  static const termsVersion = '1.0.0';
  static const privacyVersion = '1.0.0';
  static const geoConsentVersion = '1.0.0';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const betaMode = bool.fromEnvironment('BETA_MODE', defaultValue: false);

  static const phoneFrameWidth = 390.0;
  static const phoneFrameHeight = 844.0;
}
