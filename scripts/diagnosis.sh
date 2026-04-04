#!/bin/bash

# Script de diagnóstico para Esculapio (EHR)
# Ejecución: chmod +x diagnostico.sh && ./diagnostico.sh

echo "--- Iniciando diagnóstico del sistema Esculapio ---"
date
echo ""

# 1. Verificar si el backend está escuchando en el puerto esperado (ej. 5000)
echo "[1/4] Verificando puertos locales..."
BACKEND_PORT=5000
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "OK: El servidor backend está escuchando en el puerto $BACKEND_PORT."
else
    echo "ERROR: No hay ningún proceso escuchando en el puerto $BACKEND_PORT."
    echo "      Intenta iniciar el servidor con 'npm run dev' o 'pm2 start'."
fi
echo ""

# 2. Verificar estado de PostgreSQL
echo "[2/4] Verificando base de datos PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "OK: El servicio PostgreSQL está activo."
    # Intentar una conexión rápida
    if command -v psql > /dev/null; then
        sudo -u postgres psql -c '\l' > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "OK: Conexión a la base de datos exitosa."
        else
            echo "ADVERTENCIA: El servicio está activo pero la autenticación falló."
        fi
    fi
else
    echo "ERROR: El servicio PostgreSQL está caído. Ejecuta: sudo systemctl start postgresql"
fi
echo ""

# 3. Verificar Nginx (si se usa como proxy)
echo "[3/4] Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    echo "OK: Nginx está corriendo."
    nginx -t 2>&1 | grep "test is successful" > /dev/null
    if [ $? -eq 0 ]; then
        echo "OK: La configuración de Nginx es válida."
    else
        echo "ERROR: Nginx tiene errores de configuración. Revisa con: sudo nginx -t"
    fi
else
    echo "INFO: Nginx no está activo (podría no ser necesario si estás en desarrollo)."
fi
echo ""

# 4. Revisar errores recientes en los logs (últimas 20 líneas)
echo "[4/4] Buscando errores recientes en logs del servidor..."
# Ajusta la ruta a tu archivo de log o usa pm2
if command -v pm2 > /dev/null; then
    echo "Logs de PM2 (últimos errores):"
    pm2 logs --lines 20 --no-colors | grep -iE "error|exception|denied" | tail -n 10
else
    echo "Buscando en logs estándar de Node..."
    # Si tienes un archivo log específico, cámbialo aquí
    if [ -f "server.log" ]; then
        tail -n 20 server.log | grep -i "error"
    else
        echo "No se encontró archivo server.log o PM2 para inspeccionar errores automáticos."
    fi
fi

echo ""
echo "--- Diagnóstico finalizado ---"
