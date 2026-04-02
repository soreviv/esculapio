# Manual Maestro de Despliegue - Salud Digital (Producción)

Este documento consolida las instrucciones para desplegar el sistema "Salud Digital" en un servidor Linux (Ubuntu 22.04/24.04) desde cero.

**Versión del Documento:** 1.1 (Actualizado Apr-2026)
**Stack:** Node.js, Nginx, PostgreSQL, PM2.

---

## 📋 Fase 1: Preparación del Servidor

Accede a tu servidor vía SSH y actualiza los repositorios.

```bash
# 1. Actualizar sistema base
sudo apt update && sudo apt upgrade -y

# 2. Instalar herramientas esenciales
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx
```

### Instalación de Node.js (v20 LTS)
El proyecto requiere Node.js v18+, pero recomendamos v20 LTS para producción.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node -v  # Debería mostrar v20.x.x
npm -v
```

---

## 🐘 Fase 2: Base de Datos (PostgreSQL)

El sistema en producción no usa SQLite, requiere PostgreSQL.

```bash
# 1. Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 2. Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Configurar usuario y base de datos
# Reemplaza 'TU_PASSWORD_SEGURA' por una contraseña real.
sudo -u postgres psql <<EOF
CREATE USER salud_digital WITH PASSWORD 'TU_PASSWORD_SEGURA';
CREATE DATABASE salud_digital OWNER salud_digital;
GRANT ALL PRIVILEGES ON DATABASE salud_digital TO salud_digital;
\q
EOF
```

---

## 📂 Fase 3: Instalación del Código

```bash
# 1. Preparar directorio
sudo mkdir -p /var/www
cd /var/www

# 2. Clonar repositorio (Usa tu URL de GitHub)
sudo git clone https://github.com/tu-usuario/Salud-Digital.git salud-digital

# 3. Asignar permisos al usuario actual (para no usar sudo en cada paso)
sudo chown -R $USER:$USER /var/www/salud-digital

# 4. Instalar dependencias del proyecto
cd salud-digital
npm install
```

---

## ⚙️ Fase 4: Configuración de Entorno (.env)

Este es el paso más crítico. El sistema necesita variables de entorno para funcionar.

1. Crea el archivo `.env`:
   ```bash
   nano .env
   ```

2. Pega el siguiente contenido (ajustando los valores):

   ```env
   # --- CONFIGURACIÓN DE SERVIDOR ---
   NODE_ENV=production
   PORT=5000

   # --- BASE DE DATOS ---
   # Formato: postgresql://usuario:password@host:puerto/nombre_db
   DATABASE_URL=postgresql://salud_digital:TU_PASSWORD_SEGURA@localhost:5432/salud_digital

   # --- SEGURIDAD ---
   # Genera SESSION_SECRET con:      openssl rand -hex 64
   SESSION_SECRET=cambiar_por_cadena_larga_y_aleatoria_min_64_chars
   # Genera ENCRYPTION_KEY con:      openssl rand -hex 32  (OBLIGATORIA)
   ENCRYPTION_KEY=cambiar_por_cadena_aleatoria_de_exactamente_64_chars_hex
   # Genera ENCRYPTION_KDF_SALT con: openssl rand -hex 32  (OBLIGATORIA — el servidor no arranca sin ella)
   ENCRYPTION_KDF_SALT=cambiar_por_cadena_aleatoria_de_exactamente_64_chars_hex

   # --- CONFIGURACIÓN INICIAL ---
   # Contraseña para el usuario 'admin' que se creará en el paso de seed
   ADMIN_PASSWORD=AdminSeguro2026!

   # --- CORREO (para recuperación de contraseñas) ---
   SMTP_HOST=smtp.tuproveedor.com
   SMTP_PORT=587
   SMTP_USER=tu_usuario@dominio.com
   SMTP_PASS=tu_password_smtp
   SMTP_FROM=noreply@tudominio.com
   APP_BASE_URL=https://tu-dominio.com
   ```

3. Guarda y sal (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 🗄️ Fase 5: Inicialización de Datos

Antes de arrancar, debemos crear las tablas y el usuario administrador.

```bash
# 1. Cargar variables de entorno en la sesión actual
set -a
source .env
set +a

# 2. Empujar esquema a la base de datos (Crear tablas)
npm run db:push

# 3. Crear usuario administrador inicial
npx tsx scripts/seed-admin.ts
```

---

## 🏗️ Fase 6: Construcción (Build)

El frontend (React) y el backend (Express) deben compilarse para producción.

```bash
npm run build

# Verificación: Debe existir la carpeta dist/
ls -la dist/
```

---

## 🚀 Fase 7: Ejecución con PM2

Usaremos PM2 para mantener la aplicación viva siempre.

El archivo `ecosystem.config.cjs` incluido en el proyecto lee el `.env` automáticamente — no hay que copiar variables a mano.

```bash
# 1. Instalar PM2 globalmente
sudo npm install -g pm2

# 2. Iniciar la aplicación (lee .env automáticamente)
pm2 start ecosystem.config.cjs

# 3. Configurar inicio automático al reiniciar el servidor
pm2 startup systemd
# Ejecuta el comando sudo que te devuelva la terminal, por ejemplo:
#   sudo env PATH=... pm2 startup systemd -u root --hp /root

# 4. Guardar la lista de procesos
pm2 save
```

---

## 🌐 Fase 8: Servidor Web (Nginx) y SSL

Configuraremos Nginx como proxy inverso para que la app sea accesible por el puerto 80/443.

1. Crear configuración de Nginx:
   ```bash
   sudo nano /etc/nginx/conf.d/tu-dominio.conf
   ```

   > **Nota:** Usar `conf.d/` y no `sites-available/sites-enabled/`. El `nginx.conf`
   > de este servidor solo incluye `conf.d/*.conf`. El enfoque de symlink no funciona
   > a menos que `nginx.conf` tenga `include /etc/nginx/sites-enabled/*;`.

2. Contenido inicial HTTP (reemplaza `tu-dominio.com`):
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com www.tu-dominio.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Verificar y recargar Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Instalar Certificado SSL (HTTPS):
   ```bash
   sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
   ```

   Certbot modifica automáticamente el archivo en `conf.d/` y agrega el bloque HTTPS
   con redirect 301 de HTTP → HTTPS. Si la instalación automática falla, agrega el
   bloque SSL manualmente:

   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com www.tu-dominio.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name tu-dominio.com www.tu-dominio.com;

       ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
       include /etc/letsencrypt/options-ssl-nginx.conf;
       ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Luego: `sudo nginx -t && sudo systemctl reload nginx`

---

## ✅ Verificación Final

1. Navega a `https://tu-dominio.com`.
2. Inicia sesión con usuario: `admin` y la contraseña que definiste en `ADMIN_PASSWORD`.
3. Revisa los logs si algo falla: `pm2 logs esculapio`.

---

## 🔄 Actualizaciones (Re-deploy)

Para desplegar nuevos cambios después de la instalación inicial, usa siempre:

```bash
cd /var/www/esculapio
git pull
npm run deploy
```

El script `npm run deploy` hace en orden: build → libera el puerto → reinicia PM2.
**Nunca usar solo `npm run build`** sin reiniciar el proceso, o el servidor seguirá sirviendo el binario viejo.