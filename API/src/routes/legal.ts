import { Hono } from 'hono';
import { getEnv } from '../config/env.js';

const LEGAL_CONTENT = {
  terms: {
    title: 'Conditions Générales d\'Utilisation',
    version: '1.0.0',
    sections: [
      {
        heading: '1. Objet',
        body: 'RealMeety est une application de rencontre physique sans profil, photo, messagerie ni algorithme de matching. L\'application permet de visualiser les personnes disponibles à proximité de manière anonyme.',
      },
      {
        heading: '2. Éligibilité',
        body: 'L\'utilisation de RealMeety est réservée aux personnes majeures (18 ans et plus) ayant vérifié leur identité.',
      },
      {
        heading: '3. Données collectées',
        body: 'Seules les données minimales suivantes sont collectées : date de naissance, orientation sexuelle, statut de disponibilité et position géographique (uniquement lorsque l\'utilisateur est disponible).',
      },
      {
        heading: '4. Comportement',
        body: 'Tout comportement harcelant, discriminatoire ou illégal entraînera la suspension du compte.',
      },
      {
        heading: '5. Responsabilité',
        body: 'RealMeety facilite les rencontres physiques mais n\'est pas responsable des interactions entre utilisateurs.',
      },
    ],
  },
  privacy: {
    title: 'Politique de Confidentialité',
    version: '1.0.0',
    sections: [
      {
        heading: '1. Responsable du traitement',
        body: 'RealMeety SAS — contact : privacy@realmeety.fr',
      },
      {
        heading: '2. Finalités',
        body: 'Les données sont traitées pour permettre la visualisation des disponibilités à proximité, vérifier la majorité et garantir la sécurité des utilisateurs.',
      },
      {
        heading: '3. Géolocalisation',
        body: 'Votre position n\'est collectée que lorsque vous activez votre disponibilité. Elle est supprimée automatiquement après 30 minutes ou dès que vous vous rendez indisponible.',
      },
      {
        heading: '4. Vos droits (RGPD)',
        body: 'Vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données. Utilisez les paramètres de l\'application ou contactez privacy@realmeety.fr.',
      },
      {
        heading: '5. Conservation',
        body: 'Les données de compte sont conservées tant que le compte est actif. Les positions ne sont jamais archivées.',
      },
    ],
  },
  cgv: {
    title: 'Conditions Générales de Vente',
    version: '1.0.0',
    sections: [
      {
        heading: '1. Services',
        body: 'RealMeety est actuellement proposé gratuitement en phase de lancement. Des fonctionnalités premium pourront être proposées ultérieurement.',
      },
      {
        heading: '2. Paiement',
        body: 'Tout abonnement futur sera facturé via un prestataire de paiement sécurisé (Stripe). Droit de rétractation conforme à la réglementation en vigueur.',
      },
    ],
  },
};

const legal = new Hono();

legal.get('/terms', (c) => {
  const version = c.req.query('version') ?? getEnv().LEGAL_VERSION;
  return c.json({ ...LEGAL_CONTENT.terms, version });
});

legal.get('/privacy', (c) => {
  const version = c.req.query('version') ?? getEnv().LEGAL_VERSION;
  return c.json({ ...LEGAL_CONTENT.privacy, version });
});

legal.get('/cgv', (c) => {
  const version = c.req.query('version') ?? getEnv().LEGAL_VERSION;
  return c.json({ ...LEGAL_CONTENT.cgv, version });
});

export default legal;
