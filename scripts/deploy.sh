#!/bin/bash
set -e

echo "[deploy] Stopping PM2 process..."
pm2 stop salud-digital 2>/dev/null || true

echo "[deploy] Building application..."
npm run build

echo "[deploy] Starting new build..."
pm2 start ecosystem.config.cjs --env production

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Done."
pm2 status
