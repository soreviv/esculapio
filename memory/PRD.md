# Salud Digital - Guía de Deploy VPS

## Estado: Documentación revisada

### Problema Original
Revisar instrucciones de despliegue (ver MANUAL_DESPLIEGUE.md), corregir errores y asegurar que sean adecuadas.

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
# MediRecord - Expediente Clínico Electrónico

## Estado: Listo para Despliegue

### Problema Original
Revisión de preparación para despliegue: vulnerabilidades npm audit, versiones deprecadas, validación funcional.

### Arquitectura
- **Frontend**: React 18.3.1 + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Base de datos**: PostgreSQL
- **Autenticación**: Passport.js con sesiones

### Implementado (2026-02-08)
- [x] Corrección de vulnerabilidades esbuild (de 5 a 0 vulnerabilidades)
- [x] Corrección de vulnerabilidades minimatch y rollup (2026-02-27)
- [x] Actualización de paquetes: @types/node@22, vite@6.4.1, esbuild@0.25+
- [x] Unificación de versiones Tailwind CSS (v4) y limpieza de dependencias (2026-02-27)
- [x] Eliminación de autoprefixer redundante para corregir warning de PostCSS (2026-02-27)
- [x] Agregado @testing-library/dom (dependencia faltante)
- [x] Corrección de errores TypeScript en server/index.ts
- [x] Configuración de yarn resolutions para esbuild seguro
- [x] Build de producción verificado (sin warnings de PostCSS)
- [x] 56 tests unitarios pasando

### Checklist Despliegue
- [x] 0 vulnerabilidades npm/yarn audit
- [x] TypeScript compila sin errores
- [x] Build producción genera dist/index.cjs
- [x] Servidor arranca en puerto 5000
- [x] Swagger API docs funcionando (/api-docs)
- [ ] Configurar DATABASE_URL en producción
- [ ] Configurar SESSION_SECRET seguro (min 64 chars)
- [ ] Certificado SSL (Let's Encrypt)

### Backlog P1
- Actualizar date-fns 3.x -> 4.x (breaking change)
- Actualizar @hookform/resolvers 3.x -> 5.x
- Evaluar migración a React 19

### Backlog P2
- Code splitting para reducir bundle size (>500KB)
- Actualizar framer-motion a v12
- Actualizar express 4.x -> 5.x
