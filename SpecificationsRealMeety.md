# Spécifications de l’application RealMeety

## 1. Objectif général de l’application

**RealMeety** est une application mobile de rencontre centrée sur le réel, visant à faciliter des rencontres physiques immédiates, sans interaction numérique préalable :

* pas de profil ;
* pas de photo ;
* pas de messagerie ;
* pas d’algorithme de matching.

### Objectifs principaux

* Supprimer la superficialité et la virtualisation des apps de dating classiques.
* Favoriser la spontanéité, le hasard et l’authenticité.
* Garantir la protection de la vie privée et la sécurité des utilisateurs.

---

## 2. Périmètre fonctionnel

### 2.1 Plateformes supportées

* Application mobile uniquement.
* Distribution via :

  * Apple App Store ;
  * Google Play Store.

---

## 3. Spécifications fonctionnelles

### 3.1 Inscription et accès

#### 3.1.1 Création de compte

* L’utilisateur doit créer un compte pour utiliser l’application.
* Vérification obligatoire :

  * majorité légale (**18+**) ;
  * identité, via un mécanisme non détaillé mais requis juridiquement.

#### 3.1.2 Données utilisateur minimales

Aucune fiche de profil classique.

**Données autorisées :**

* Âge.
* Orientation sexuelle.
* Statut de disponibilité.
* Position géographique en temps réel, contrôlée par l’utilisateur.

**Données explicitement exclues :**

* Photos.
* Bio.
* Centres d’intérêt.
* Historique de swipe.
* Algorithmes de recommandation.

---

## 4. Spécifications non fonctionnelles

### 4.1 Performance et scalabilité

* Support d’une montée en charge rapide.
* Gestion de fortes densités locales d’utilisateurs.
* Backend scalable.

### 4.2 Sécurité

* Données de localisation considérées comme sensibles.
* Chiffrement des données.
* Accès à la géolocalisation uniquement à la demande.
* Aucune conservation inutile des données.

### 4.3 Conformité réglementaire

* RGPD strict.
* Obligations CNIL.
* CGU / CGV.
* Gestion du consentement utilisateur.

---

## 5. Contraintes techniques

* Application mobile native ou hybride.
* Utilisation d’API de cartographie.
* Outils tiers pour :

  * paiement ;
  * géolocalisation.
* Hébergement sécurisé.
* Coût cible : **environ 1 000 €/mois** en phase initiale.

---

## 6. Fonctionnalités explicitement exclues

* Pas de matching.
* Pas de messagerie.
* Pas de swipe.
* Pas de profils détaillés.
* Pas d’algorithme de recommandation.

---

## 7. Évolutions envisagées hors MVP

* Fonctionnalités avancées de sécurité.
* Interactions anonymes limitées.
* Technologie propriétaire de densité sociale en temps réel.
* Déploiement européen.