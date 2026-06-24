import 'package:flutter_test/flutter_test.dart';
import 'package:realmeety/domain/models/enums.dart';

void main() {
  test('SexualOrientation fromApi returns correct value', () {
    expect(
      SexualOrientation.fromApi('heterosexual'),
      SexualOrientation.heterosexual,
    );
  });

  test('AvailabilityStatus fromApi defaults to unavailable', () {
    expect(
      AvailabilityStatus.fromApi('unknown'),
      AvailabilityStatus.unavailable,
    );
  });
}
