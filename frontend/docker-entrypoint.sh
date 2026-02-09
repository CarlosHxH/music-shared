#!/bin/sh
set -e

# Substituir variáveis de ambiente no template do nginx
# Apenas BACKEND_HOST e BACKEND_PORT são substituídas (preserva variáveis do nginx como $host, $uri, etc.)
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "=== Nginx config gerada ==="
echo "Backend upstream: http://${BACKEND_HOST}:${BACKEND_PORT}"
cat /etc/nginx/conf.d/default.conf
echo "==========================="

# Executar nginx
exec nginx -g 'daemon off;'
