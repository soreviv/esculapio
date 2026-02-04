#!/bin/bash
# Script de backup para PostgreSQL - Salud Digital
# Uso: ./backup-db.sh
# Configura en cron para backups automáticos:
# 0 2 * * * /var/www/salud-digital/scripts/backup-db.sh

set -e

# Configuración
DB_NAME="salud_digital"
DB_USER="salud_digital"
DB_HOST="localhost"
BACKUP_DIR="/var/backups/salud-digital"
RETENTION_DAYS=30

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Realizar backup comprimido
echo "[$(date)] Iniciando backup de $DB_NAME..."
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verificar que el backup se creó
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] ✅ Backup completado: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] ❌ Error: No se pudo crear el backup"
    exit 1
fi

# Eliminar backups antiguos
echo "[$(date)] Eliminando backups mayores a $RETENTION_DAYS días..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Listar backups actuales
echo "[$(date)] Backups disponibles:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No hay backups"

echo "[$(date)] Proceso de backup finalizado."
