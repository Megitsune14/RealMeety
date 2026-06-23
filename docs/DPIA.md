# Analyse d'impact relative à la protection des données (DPIA)

**Application** : RealMeety v1.0.0  
**Date** : 2025  
**Responsable** : RealMeety SAS

## 1. Description du traitement

RealMeety collecte des données minimales pour afficher des points anonymes sur une carte lorsque l'utilisateur active son statut « disponible ».

| Donnée | Finalité | Base légale |
|---|---|---|
| Email | Authentification | Contrat |
| Âge | Filtres, majorité | Contrat + obligation légale |
| Orientation | Filtres compatibilité | Consentement |
| Position GPS | Affichage proximité | Consentement explicite |
| Données KYC | Vérification identité/majorité | Obligation légale |

## 2. Données exclues (privacy by design)

- Photos de profil, bio, centres d'intérêt
- Historique de swipe, algorithmes de matching
- Messagerie entre utilisateurs
- Conservation historique de trajets GPS

## 3. Mesures de sécurité

- Obfuscation position (~75 m) avant diffusion
- TTL position 90 secondes
- Chiffrement TLS 1.3 en transit
- Chiffrement at rest (PostgreSQL managed)
- Hébergement UE (Frankfurt/Paris)

## 4. Risques identifiés

| Risque | Mesure |
|---|---|
| Ré-identification via position | Obfuscation + ID session éphémère |
| Accès non autorisé | JWT courts, refresh rotatif |
| Fuite base de données | Minimisation, pas de photos |
| Mineurs | Vérification 18+ + KYC |

## 5. Droits des personnes

- Accès, rectification, effacement, portabilité via l'app (`/me/export`, `DELETE /me`)
- Contact DPO : dpo@realmeety.app

## 6. Conformité CNIL

- Registre des activités de traitement tenu à jour
- Consentement granulaire (localisation, KYC, marketing opt-in)
- Politique de confidentialité accessible in-app
