enum SexualOrientation {
  heterosexual('heterosexual', 'Hétérosexuel·le'),
  homosexual('homosexual', 'Homosexuel·le'),
  bisexual('bisexual', 'Bisexuel·le'),
  pansexual('pansexual', 'Pansexuel·le'),
  other('other', 'Autre'),
  preferNotToSay('prefer_not_to_say', 'Préfère ne pas dire');

  const SexualOrientation(this.apiValue, this.label);
  final String apiValue;
  final String label;

  static SexualOrientation? fromApi(String value) {
    for (final o in values) {
      if (o.apiValue == value) return o;
    }
    return null;
  }
}

enum AvailabilityStatus {
  available('available', 'Disponible'),
  unavailable('unavailable', 'Indisponible'),
  paused('paused', 'En pause');

  const AvailabilityStatus(this.apiValue, this.label);
  final String apiValue;
  final String label;

  static AvailabilityStatus fromApi(String value) {
    return values.firstWhere(
      (s) => s.apiValue == value,
      orElse: () => AvailabilityStatus.unavailable,
    );
  }
}

enum ConsentType {
  geolocation('geolocation', 'Géolocalisation'),
  terms('terms', 'Conditions d\'utilisation'),
  privacy('privacy', 'Politique de confidentialité'),
  marketing('marketing', 'Communications marketing');

  const ConsentType(this.apiValue, this.label);
  final String apiValue;
  final String label;
}
