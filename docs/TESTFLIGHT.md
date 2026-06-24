# TestFlight — RealMeety iOS

## Prérequis

- Mac avec Xcode 15+
- Compte Apple Developer (99 €/an)
- Flutter installé localement

## Configuration

### 1. Bundle ID

Dans Xcode → `ios/Runner` :

- Bundle Identifier : `com.realmeety.app`
- Display Name : `RealMeety`

### 2. Permissions (déjà dans Info.plist)

- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

### 3. API de production

```bash
cd app
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.realmeety.fr \
  --dart-define=BETA_MODE=true
```

## Build & upload

### Option A — Xcode

```bash
open ios/Runner.xcworkspace
```

1. Product → Archive
2. Distribute App → App Store Connect → Upload

### Option B — CLI

```bash
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.realmeety.fr \
  --export-options-plist=ios/ExportOptions.plist
```

Créer `ios/ExportOptions.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>VOTRE_TEAM_ID</string>
</dict>
</plist>
```

## App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Nouvelle app
2. TestFlight → Groupe interne → Ajouter testeurs (email Apple ID)
3. Soumettre le build pour review beta (souvent < 24 h)

## Notes POC

- Pas besoin de fiche App Store complète pour TestFlight interne
- Politique de confidentialité requise : URL `https://<domaine>/legal/privacy` ou page web
- Stripe Identity fonctionne dans Safari in-app après redirection

## Checklist avant envoi

- [ ] API prod accessible depuis l'iPhone
- [ ] KYC Stripe webhook configuré
- [ ] Zone beta couvre le lieu du test
- [ ] 5+ testeurs iOS dans la zone
