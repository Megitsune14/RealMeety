#!/usr/bin/env bash
set -euo pipefail

# Déploiement RealMeety sur VPS Ubuntu (UE)
# Prérequis : Docker, Docker Compose, domaine pointant vers le VPS

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "Copiez .env.production.example vers .env et remplissez les valeurs."
  exit 1
fi

set -a
source .env
set +a

echo "==> Build & démarrage des services..."
docker compose -f docker-compose.vps.yml --env-file .env up --build -d

echo "==> Vérification API..."
sleep 5
curl -sf "https://api.${DOMAIN}/health" && echo " API OK" || echo " API pas encore prête (TLS en cours)"

echo ""
echo "Déploiement terminé."
echo "  App  : https://${DOMAIN}"
echo "  API  : https://api.${DOMAIN}"
echo ""
echo "Configurer le webhook Stripe :"
echo "  https://api.${DOMAIN}/identity/webhook"
echo "  Événements : identity.verification_session.verified"
