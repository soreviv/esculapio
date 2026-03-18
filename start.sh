#!/bin/bash
# Script de inicio para Salud Digital
# Carga variables de .env y arranca el servidor

cd /var/www/Salud-Digital

export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)

exec node dist/index.cjs
