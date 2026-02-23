# Salud Digital - Guía de Deploy VPS

## Estado: Documentación revisada

### Problema Original
Revisar DEPLOY_VPS.md, corregir errores y asegurar que las instrucciones de despliegue sean adecuadas.

### Arquitectura
- **App**: Node.js + Express + TypeScript (cliente integrado con Vite build)
- **DB**: PostgreSQL
- **Infra**: PM2 + Nginx + Let's Encrypt
- **Variables**: requeridas vía entorno (no carga automática de .env)

### Implementado
- Aclarado que el proyecto no carga `.env` automáticamente
- Añadidos pasos para exportar variables antes de migraciones/seed/PM2
- PM2 inicia con `--update-env` para conservar variables cargadas

### Backlog P0
- Validar si se desea usar `ecosystem.config.cjs` con variables explícitas

### Backlog P1
- Agregar nota sobre persistencia de variables al reiniciar el servidor

### Backlog P2
- Incluir sección de rotación de logs y backups automatizados
