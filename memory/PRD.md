# Salud Digital - SEO & Documentación

## Estado: Actualización de Documentación y SEO

### Problema Original
Actualiza el README.md y crea/actualiza el sitemap.xml con la URL base de https://www.viveros.click.

### Arquitectura
- **Frontend**: React + Vite (carpeta /client)
- **Backend**: Express + TypeScript (carpeta /server)
- **SEO estático**: sitemap.xml y robots.txt en /client/public

### Implementado
- README actualizado (imagen corregida, puertos de desarrollo y sección SEO con dominio real)
- sitemap.xml actualizado con dominio https://www.viveros.click y rutas públicas
- robots.txt actualizado para apuntar al nuevo sitemap

### Backlog P0
- Validar si hay rutas públicas adicionales que deban agregarse al sitemap

### Backlog P1
- Automatizar la generación del sitemap en build/CI para evitar desactualización de fechas

### Backlog P2
- Añadir verificación automatizada de robots.txt y sitemap en pruebas
