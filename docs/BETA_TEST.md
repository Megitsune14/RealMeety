# Guide beta terrain — RealMeety

## Objectif

Valider en 1–2 semaines si des utilisateurs activent leur disponibilité et si la densité locale est suffisante.

## Prérequis

1. API déployée (`deploy/deploy.sh`)
2. Stripe Identity configuré (webhook → `https://api.<domaine>/identity/webhook`)
3. MongoDB Atlas (région UE)
4. Zone beta définie dans `.env` :

```env
BETA_MODE=true
BETA_CENTER_LAT=48.8620
BETA_CENTER_LNG=2.3610
BETA_RADIUS_METERS=3000
```

## Recruter 10–20 testeurs

- Amis dans la zone géographique cible
- Un lieu précis aide : quartier, campus, événement

## Distribuer l'app

### Android (le plus simple)

```powershell
.\scripts\build-android.ps1 -ApiUrl "https://api.realmeety.fr"
```

Envoyer `app/build/app/outputs/flutter-apk/app-release.apk` aux testeurs (email, Drive, Firebase App Distribution).

### iOS

Voir [TESTFLIGHT.md](./TESTFLIGHT.md).

### Web (secours)

`https://<domaine>` — cadre téléphone, géoloc navigateur.

## Parcours testeur

1. Créer un compte (email + date de naissance)
2. Vérifier l'identité (Stripe Identity)
3. Accepter la géolocalisation
4. Aller physiquement dans la zone beta
5. Activer « Je suis disponible »
6. Observer si d'autres points apparaissent sur la carte

## Métriques à suivre

| Métrique | Cible POC |
|----------|-----------|
| Inscriptions | 10+ |
| Vérifications KYC réussies | 80%+ |
| Activations disponibilité | 50%+ des inscrits |
| Sessions simultanées | 3+ dans la zone |
| Rétention J+3 | 30%+ |

## Feedback à collecter

- Compréhension du concept (sans explication orale)
- Confiance (partage de position)
- Friction KYC
- Envie de retourner sur l'app

## Dépannage

| Problème | Solution |
|----------|----------|
| « Zone beta limitée » | Se déplacer dans le rayon configuré |
| KYC bloqué | Vérifier webhook Stripe |
| Carte vide | Au moins 2 personnes disponibles dans la zone |

## Après la beta

- `BETA_MODE=false` pour ouvrir géographiquement
- Analyser les logs audit MongoDB (`audit_logs`)
- Décider : pivot, itération, ou scale
