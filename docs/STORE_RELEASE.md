# Guide de publication App Store / Google Play

## Prérequis

- [ ] Compte Apple Developer (99 €/an)
- [ ] Compte Google Play Console (25 € one-time)
- [ ] Shell Sparkling buildé iOS + Android
- [ ] Backend production déployé (UE)
- [ ] URL politique confidentialité publique

## Assets requis

Placer dans `store/assets/` :

| Asset | Spécifications |
|---|---|
| `icon-1024.png` | 1024×1024, iOS App Store |
| `icon-play.png` | 512×512, Google Play |
| `screenshots/` | 6.7" iPhone + Pixel 7 (carte, onboarding, paywall) |
| `feature-graphic.png` | 1024×500, Google Play |
| `privacy-policy-url` | https://realmeety.app/privacy |

## Apple App Store

### Privacy Nutrition Labels

- **Data Linked to You** : Email, Precise Location (when available), Other (orientation, age)
- **Data Not Collected** : Photos, Browsing History, Contacts
- **Tracking** : No

### Permission justifications

- **Location (When In Use)** : « RealMeety partage votre position uniquement lorsque vous activez le mode Disponible, pour afficher des personnes à proximité sur la carte. »

### TestFlight

1. Archive Xcode → Upload to App Store Connect
2. Internal Testing → ajouter testeurs
3. Vidéo demo pour reviewers montrant toggle disponibilité

## Google Play

### Data Safety

- Location : collected, ephemeral, user control
- Personal info : email, age
- No data shared with third parties (except KYC processor Stripe Identity)

### Internal Testing

1. Build signed AAB
2. Play Console → Internal testing track
3. Ajouter liste testeurs

## Checklist soumission

- [ ] CGU et politique confidentialité v1.0.0
- [ ] DPIA signée ([docs/DPIA.md](DPIA.md))
- [ ] KYC Stripe Identity configuré production
- [ ] RevenueCat produits actifs
- [ ] Backend TLS + monitoring Sentry
- [ ] Test complet flow onboarding → carte → premium → suppression compte
