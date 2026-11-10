#!/usr/bin/env bash
# Redeploy after changing code (run from the project root on EC2):   bash deploy/update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Updating backend"
(cd server && npm ci --omit=dev)
pm2 restart cloudvault-api

echo "==> Rebuilding frontend"
(cd client && npm ci && npm run build)
sudo rm -rf /var/www/cloudvault/*
sudo cp -r client/dist/* /var/www/cloudvault/

echo "Done. Health check: $(curl -s http://localhost/api/health)"
