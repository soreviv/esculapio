#!/bin/bash
set -e

echo "[deploy] Building application..."
npm run build

echo "[deploy] Releasing port 5000..."
fuser -k 5000/tcp 2>/dev/null && sleep 1 || true

echo "[deploy] Resetting PM2 restart counter..."
pm2 reset salud-digital 2>/dev/null || true

echo "[deploy] Starting new build..."
pm2 restart ecosystem.config.cjs --env production

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
pm2 status
