# Sparkling Shell — RealMeety

Shell natif iOS/Android basé sur [Sparkling](https://lynxjs.org/guide/start/build-with-app-framework.md) pour la distribution App Store / Google Play.

## Structure

```
apps/sparkling/
├── ios/                    # Projet Xcode + LynxView + MapKit
├── android/                # Projet Gradle + LynxView + Google Maps
└── native-modules/
    ├── LocationModule/     # GPS foreground-only
    ├── AuthModule/         # Keychain / EncryptedSharedPrefs
    ├── PaymentModule/      # RevenueCat SDK
    └── MapView/            # Custom Element carte native
```

## Intégration Lynx bundle

1. Build UI : `npm run build --workspace=@realmeety/lynx`
2. Copier `apps/lynx/dist/*.lynx.bundle` vers les assets natifs ou CDN OTA
3. Configurer `TemplateProvider` / `LynxResourceProvider` dans Sparkling

## Native Modules

Les interfaces TypeScript sont définies dans [`apps/lynx/src/native/modules.ts`](../lynx/src/native/modules.ts).

### LocationModule (iOS — Swift)

```swift
@objc(LocationModule)
class LocationModule: NSObject {
  @objc func requestPermission(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock)
  @objc func getCurrentPosition(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock)
  @objc func startWatching()
  @objc func stopWatching()
}
```

- Permission : `NSLocationWhenInUseUsageDescription` uniquement
- Arrêt automatique quand l'app passe en background si `availability != available`

### LocationModule (Android — Kotlin)

```kotlin
class LocationModule : LynxModule() {
  fun requestPermission(promise: Promise)
  fun getCurrentPosition(promise: Promise)
  fun startWatching()
  fun stopWatching()
}
```

- `ACCESS_FINE_LOCATION` + foreground service notification en mode disponible

### MapView Custom Element

- iOS : `MKMapView` avec clustering (`MKClusterAnnotation`)
- Android : `GoogleMap` avec `ClusterManager`
- Props : `markers`, `userLocation`, `radiusMeters`, `bindregionchange`

### PaymentModule

- RevenueCat SDK : `Purchases.configure()`, `purchasePackage()`, `restorePurchases()`
- Produits : `realmeety_premium_monthly`, `realmeety_premium_yearly`

## Permissions store

| Permission | Justification review |
|---|---|
| Localisation (when in use) | Afficher proximité uniquement en mode disponible |
| Caméra (KYC Stripe Identity) | Vérification identité légale, pas de profil |

## Dev sans shell natif

Utiliser **Lynx Explorer** : `npm run dev --workspace=@realmeety/lynx` puis scanner le QR code.

Les Native Modules sont mockés dans `modules.ts` pour le développement Explorer.
