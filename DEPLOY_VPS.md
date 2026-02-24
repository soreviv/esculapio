# Guía de Despliegue - Salud Digital en VPS Ubuntu

Esta guía te ayudará a desplegar el proyecto en tu VPS Hostinger con Ubuntu, PostgreSQL y Let's Encrypt.

---

## 📋 Requisitos Previos

- VPS con Ubuntu 22.04/24.04 LTS
- Acceso SSH con permisos sudo
- Dominio apuntando a la IP del VPS (registro A configurado)
- Puerto 80 y 443 abiertos en el firewall

---

## 🚀 Paso 1: Conectar al VPS

```bash
ssh usuario@tu-dominio.com
# o con IP
ssh usuario@IP_DEL_VPS
```

---

## 🔧 Paso 2: Actualizar el Sistema e Instalar Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias esenciales
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v20.x.x
npm --version
```

---

## 🐘 Paso 3: Instalar y Configurar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar y habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
sudo -u postgres psql <<EOF
CREATE USER salud_digital WITH PASSWORD 'TU_PASSWORD_SEGURA_AQUI';
CREATE DATABASE salud_digital OWNER salud_digital;
GRANT ALL PRIVILEGES ON DATABASE salud_digital TO salud_digital;
\q
EOF

# Verificar conexión
psql -h localhost -U salud_digital -d salud_digital -c "SELECT 1;"
```

**⚠️ IMPORTANTE**: Reemplaza `TU_PASSWORD_SEGURA_AQUI` con una contraseña segura.

---

## 📁 Paso 4: Clonar y Configurar el Proyecto

```bash
# Crear directorio de aplicaciones
sudo mkdir -p /var/www
cd /var/www

# Clonar el repositorio (reemplaza con tu URL)
sudo git clone https://github.com/tu-usuario/salud-digital.git
cd salud-digital

# Cambiar propietario al usuario actual
sudo chown -R $USER:$USER /var/www/salud-digital

# Instalar dependencias
npm install
```

---

## ⚙️ Paso 5: Configurar Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto:

```bash
cat > .env << 'EOF'
# Base de datos PostgreSQL
DATABASE_URL=postgresql://salud_digital:TU_PASSWORD_SEGURA_AQUI@localhost:5432/salud_digital

# Configuración de sesiones (genera una clave segura)
SESSION_SECRET=GENERA_UNA_CLAVE_ALEATORIA_DE_64_CARACTERES

# Entorno
NODE_ENV=production
PORT=5000

# Pool de conexiones (opcional)
DB_POOL_MAX=20
DB_POOL_MIN=2

# Logging
LOG_LEVEL=info

# Admin inicial (solo para primer despliegue)
ADMIN_PASSWORD=ContraseñaAdminSegura123!
EOF
```

**Generar SESSION_SECRET:**
```bash
openssl rand -hex 32
```

**Importante:** el proyecto no carga `.env` automáticamente. Antes de migrar, crear el admin o iniciar PM2, exporta las variables en tu sesión:

```bash
set -a
source .env
set +a
```

---

## 🗄️ Paso 6: Migrar Base de Datos y Crear Admin

Asegúrate de haber cargado las variables del `.env` (paso anterior).

```bash
# Ejecutar migraciones de Drizzle
npm run db:push

# Crear usuario administrador inicial
npx tsx scripts/seed-admin.ts
```

---

## 🏗️ Paso 7: Compilar para Producción

```bash
# Compilar el proyecto
npm run build

# Verificar que se creó el directorio dist/
ls -la dist/
```

---

## 🔄 Paso 8: Configurar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Cargar variables .env en esta sesión (si aún no lo hiciste)
set -a
source .env
set +a

# Iniciar la aplicación (PM2 guardará estas variables al hacer pm2 save)
pm2 start dist/index.cjs --name "salud-digital" --env production --update-env

# Configurar inicio automático
pm2 startup systemd
# Ejecuta el comando que te muestre

# Guardar configuración
pm2 save

# Verificar estado
pm2 status
pm2 logs salud-digital
```

---

## 🌐 Paso 9: Configurar Nginx como Reverse Proxy

Crea la configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/salud-digital
```

Pega el siguiente contenido (reemplaza `tu-dominio.com`):

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Activar el sitio:

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/salud-digital /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Paso 10: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones:
# - Ingresa tu email
# - Acepta los términos
# - Selecciona redireccionar HTTP a HTTPS (opción 2)

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 🔥 Paso 11: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH, HTTP y HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Verificar estado
sudo ufw status
```

---

## ✅ Verificación Final

1. **Acceder a la aplicación**: https://tu-dominio.com
2. **Verificar SSL**: El candado verde debe aparecer en el navegador
3. **Probar login**: Usuario `admin`, contraseña definida en `ADMIN_PASSWORD`
4. **Verificar API Docs**: https://tu-dominio.com/api-docs

---

## 🛠️ Comandos Útiles de Mantenimiento

```bash
# Ver logs de la aplicación
pm2 logs salud-digital

# Reiniciar aplicación
pm2 restart salud-digital

# Ver estado de la aplicación
pm2 status

# Actualizar código (después de git pull)
npm install
npm run build
pm2 restart salud-digital

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Renovar certificado SSL manualmente
sudo certbot renew

# Backup de base de datos
pg_dump -U salud_digital -h localhost salud_digital > backup_$(date +%Y%m%d).sql
```

---

## 🔄 Script de Actualización Rápida

Crea un script para actualizaciones futuras:

```bash
cat > /var/www/salud-digital/deploy.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/salud-digital
git pull origin main
npm install
npm run build
pm2 restart salud-digital
echo "✅ Despliegue completado"
EOF

chmod +x /var/www/salud-digital/deploy.sh
```

Para actualizar: `./deploy.sh`

---

## ⚠️ Checklist de Seguridad para Producción

- [ ] Cambiar SESSION_SECRET por una clave única y segura
- [ ] Cambiar contraseña de PostgreSQL
- [ ] Cambiar ADMIN_PASSWORD inicial
- [ ] Configurar backups automáticos de la base de datos
- [ ] Habilitar fail2ban para protección contra ataques
- [ ] Configurar monitoreo (opcional: UptimeRobot, Healthchecks.io)

---

## 🆘 Solución de Problemas

### La aplicación no inicia
```bash
pm2 logs salud-digital --lines 50
```

### Error de conexión a PostgreSQL
```bash
sudo systemctl status postgresql
psql -h localhost -U salud_digital -d salud_digital
```

### Nginx devuelve 502 Bad Gateway
```bash
pm2 status  # Verificar que la app esté corriendo
sudo nginx -t  # Verificar configuración
```

### Certificado SSL no funciona
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

**¡Listo!** Tu sistema de expediente clínico electrónico está ahora desplegado de forma segura en tu VPS.
