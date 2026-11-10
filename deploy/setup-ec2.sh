#!/usr/bin/env bash
# One-time setup for an Ubuntu EC2 instance.
# Run from the project root:   bash deploy/setup-ec2.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="/var/www/cloudvault"
cd "$ROOT"

if [ ! -f server/.env ]; then
  echo "ERROR: server/.env not found."
  echo "Run:  cp server/.env.example server/.env   then edit it (nano server/.env)."
  exit 1
fi

echo "==> 1/7 Adding 1 GB swap (prevents out-of-memory errors on t2.micro / t3.micro)"
if ! sudo swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "==> 2/7 Installing system packages (Nginx, build tools)"
sudo apt-get update -y
sudo apt-get install -y nginx build-essential python3 curl

echo "==> 3/7 Installing Node.js 22 LTS and PM2"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v pm2 >/dev/null 2>&1 || sudo npm install -g pm2
echo "    Node $(node -v), npm $(npm -v), PM2 $(pm2 -v)"

echo "==> 4/7 Installing backend dependencies"
(cd server && npm ci --omit=dev)

echo "==> 5/7 Building the React frontend"
(cd client && npm ci && npm run build)
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -r client/dist/* "$WEB_ROOT"/

echo "==> 6/7 Configuring Nginx"
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cloudvault
sudo ln -sf /etc/nginx/sites-available/cloudvault /etc/nginx/sites-enabled/cloudvault
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx >/dev/null

echo "==> 7/7 Starting the API with PM2"
pm2 delete cloudvault-api >/dev/null 2>&1 || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$(whoami)" --hp "$HOME" >/dev/null
pm2 save

sleep 3
echo
pm2 logs cloudvault-api --lines 5 --nostream || true
echo
echo "Health check: $(curl -s http://localhost/api/health || echo 'not responding')"

TOKEN=$(curl -s --max-time 3 -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' || true)
PUBLIC_IP=$(curl -s --max-time 3 -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
echo
echo "Setup complete. Open:  http://${PUBLIC_IP:-<your-ec2-public-ip>}"
