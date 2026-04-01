-- ============================================================
-- Seed: Tenant OtorrinoNet — Dr. Alejandro Viveros Domínguez
-- Ejecutar UNA SOLA VEZ en producción con psql o similar:
--   psql $DATABASE_URL -f scripts/seed-otorrinonet.sql
--
-- Después de ejecutar, configurar en la UI de Configuración:
--   - Teléfono, domicilio, ciudad, estado
--   - Horarios de atención (pestaña "Horarios")
--   - Clave API de Gemini (pestaña "Portal Web")
--   - Logo del consultorio
--   - Clave de hCaptcha si se desea usar captcha
-- ============================================================

BEGIN;

-- 1. Tenant
INSERT INTO tenants (slug, nombre, plan)
VALUES ('otorrinonet', 'OtorrinoNet - Dr. Alejandro Viveros Domínguez', 'pro')
ON CONFLICT (slug) DO NOTHING;

-- 2. Portal Settings
--    Los horarios se configuran desde la UI; aquí se inicializan con
--    los días típicos de la clínica (Lun-Vie mañana y tarde).
INSERT INTO portal_settings (
  tenant_id,
  portal_enabled,
  tipo_establecimiento,
  nombre_establecimiento,
  domicilio,
  ciudad,
  estado,
  portal_title,
  portal_tagline,
  appointment_duration_min,
  booking_advance_days,
  horarios,
  notification_email
)
SELECT
  id,
  true,
  'Consultorio',
  'OtorrinoNet',
  '',   -- completar en UI
  '',   -- completar en UI
  '',   -- completar en UI
  'OtorrinoNet — Otorrinolaringología',
  'Atención especializada en oído, nariz y garganta',
  30,
  30,
  '[
    {"dia":"Lunes",     "inicio":"16:00","fin":"19:00","activo":true},
    {"dia":"Martes",    "inicio":"16:00","fin":"19:00","activo":true},
    {"dia":"Miércoles", "inicio":"16:00","fin":"19:00","activo":true},
    {"dia":"Jueves",    "inicio":"10:00","fin":"13:00","activo":true},
    {"dia":"Jueves",    "inicio":"16:00","fin":"19:00","activo":true},
    {"dia":"Viernes",   "inicio":"10:00","fin":"13:00","activo":true},
    {"dia":"Sábado",    "inicio":"10:00","fin":"13:00","activo":false},
    {"dia":"Domingo",   "inicio":"00:00","fin":"00:00","activo":false}
  ]'::jsonb,
  ''    -- completar en UI
FROM tenants
WHERE slug = 'otorrinonet'
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Usuario médico propietario
--    IMPORTANTE: Cambiar la contraseña desde la UI después del primer login.
--    El hash de abajo corresponde a la contraseña temporal "CambiarMe2024!"
--    generada con bcrypt (12 rounds). NO usar en producción sin cambiarla.
INSERT INTO users (
  tenant_id,
  is_tenant_owner,
  username,
  password,
  role,
  nombre,
  especialidad,
  cedula
)
SELECT
  id,
  true,
  'drviveros',
  -- Hash temporal de "CambiarMe2024!" — CAMBIAR INMEDIATAMENTE tras primer login
  '$2b$12$PLACEHOLDER_HASH_REPLACE_ME_BEFORE_RUNNING',
  'medico',
  'Dr. Alejandro Viveros Domínguez',
  'Otorrinolaringología',
  NULL  -- completar en UI con cédula real
FROM tenants
WHERE slug = 'otorrinonet'
ON CONFLICT (username) DO NOTHING;

COMMIT;

-- ============================================================
-- Para generar un hash bcrypt real, ejecutar en Node.js:
--
--   node -e "
--     const bcrypt = require('bcrypt');
--     bcrypt.hash('TuContraseñaSegura', 12).then(h => console.log(h));
--   "
--
-- Luego reemplazar el PLACEHOLDER_HASH_REPLACE_ME en este script.
-- ============================================================
