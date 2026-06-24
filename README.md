# RealMeety

Application mobile de rencontre centrée sur le réel — sans profil, photo, messagerie ni algorithme de matching.

## Structure

```
RealMeety/
├── app/          # Flutter (mobile iOS/Android + web cadre téléphone)
├── API/          # Hono + TypeScript + MongoDB + Redis
├── docker-compose.yml
├── docker-compose.prod.yml
└── Spec.md
```

## Démarrage rapide

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| App web | http://localhost:8080 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

Production :

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Fonctionnalités implémentées

### Conformité Spec.md

- Inscription avec date de naissance (18+)
- Données minimales : âge, orientation, disponibilité, position
- Vérification d'identité (MVP simulé, prêt pour KYC)
- Carte OpenStreetMap avec clusters géohash anonymes
- Géolocalisation native (geolocator) avec consentement explicite
- Pas de matching, messagerie, swipe, profils détaillés
- RGPD : export données, suppression compte, gestion consentements
- CGU, politique de confidentialité, CGV via API
- Sécurité : rate limiting Redis, audit logs, TTL position, JWT + refresh

### UI/UX

- Design system (Outfit, composants réutilisables)
- Onboarding en 4 étapes avec stepper
- Carte plein écran avec filtres (rayon, orientation)
- Accessibilité : Semantics, liveRegion, contrastes, tailles tactiles
- Web : cadre téléphone pour expérience mobile accessible

## API — Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |
| POST | `/auth/refresh` | Renouveler le token |
| POST | `/auth/logout` | Déconnexion |
| GET | `/users/me` | Profil minimal |
| PATCH | `/users/me` | Modifier âge/orientation |
| PATCH | `/users/me/availability` | Disponibilité (persistée) |
| PUT | `/location` | Position (consentement requis) |
| GET | `/map/nearby` | Clusters anonymes à proximité |
| POST | `/consent` | Gestion consentements |
| POST | `/identity/verify` | Vérification identité |
| GET | `/gdpr/export` | Export RGPD |
| DELETE | `/gdpr/account` | Suppression compte |
| GET | `/legal/terms` | CGU |
| GET | `/legal/privacy` | Politique confidentialité |
| GET | `/health` | Santé du service |

## Développement local

### API

```bash
cd API && cp .env.example .env && npm install && npm run dev
```

### App Flutter

```bash
cd app
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

### Générer les plateformes natives

```bash
cd app
flutter create . --platforms=android,ios,web
```

## Tests

```bash
cd API && npm test
cd app && flutter test
```

## Reste pour production store

- Intégration KYC réelle (Onfido, Stripe Identity)
- Certificats Apple/Google + soumission stores
- Hébergement UE (MongoDB Atlas, TLS)
- Paiement Stripe (si modèle premium validé)

## Licence

Propriétaire — RealMeety © 2026
