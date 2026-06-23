# RealMeety

Application mobile de rencontre physique — sans profil, sans messagerie, sans algorithme.

## Stack

- **UI** : [ReactLynx](https://lynxjs.org/) + Rspeedy
- **Shell natif** : Sparkling (iOS/Android)
- **Backend** : Fastify + PostgreSQL/PostGIS + Redis
- **Paiement** : RevenueCat + Stripe
- **KYC** : Stripe Identity

## Démarrage rapide

### Prérequis

- Node.js 22+
- Docker (PostgreSQL + Redis)

### Installation

```bash
npm install
docker compose up -d
cp backend/.env.example backend/.env
npm run migrate --workspace=@realmeety/backend
npm run seed --workspace=@realmeety/backend
```

### Développement

**Option recommandée — preview navigateur (cadre téléphone, dev uniquement) :**

```bash
# Terminal 1 — API (+ Docker si pas déjà fait)
npm run dev:api

# Terminal 2 — UI en cadre téléphone dans Chrome/Edge
npm run dev:preview
```

Ouvrez **http://127.0.0.1:8080** — même code UI que Lynx, rendu DOM via shim dev (`packages/lynx-dom-shim`).

**Option Lynx Explorer (QR code)** — pour tester le bundle natif Lynx :

```bash
npm run dev:api
npm run dev:lynx
# Scanner le QR code avec Lynx Explorer
```

Compte démo : `demo@realmeety.app` / `password123`

### Tests

```bash
npm run test --workspace=@realmeety/backend
npm run typecheck
```

## Structure

```
apps/lynx/          ReactLynx UI (cible native production)
apps/preview-web/   Preview navigateur cadre téléphone (dev uniquement)
apps/sparkling/     Shell natif + Native Modules
backend/            API REST + WebSocket présence
packages/shared/    Types partagés
docs/               DPIA, guide store
```

## Fonctionnalités MVP

- Inscription avec vérification 18+ et KYC
- Données minimales : âge, orientation, disponibilité, position
- Carte avec points anonymes filtrés
- Freemium (500 m / 30 min) vs Premium (2 km / illimité)
- Conformité RGPD : export, suppression, consentements

## Documentation

- [Spécifications](SpecificationsRealMeety.md)
- [DPIA](docs/DPIA.md)
- [Publication stores](docs/STORE_RELEASE.md)
- [Sparkling shell](apps/sparkling/README.md)
