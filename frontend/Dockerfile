# Stage 1: Build
FROM node:20-alpine AS build

# Labels de build
LABEL stage="build"

# Build args para variáveis de ambiente do Vite
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=/ws
ARG VITE_MINIO_ENDPOINT=http://localhost:9000

# Definir como variáveis de ambiente para o build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_MINIO_ENDPOINT=${VITE_MINIO_ENDPOINT}

WORKDIR /app

# Copiar apenas arquivos de dependências primeiro (melhor cache)
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build && \
    rm -rf node_modules && \
    rm -rf .next .nuxt .cache

# Stage 2: Runtime
FROM nginx:alpine

# Labels de segurança e metadados
LABEL maintainer="SEPLAG Team" \
      description="Frontend React Application" \
      version="1.0" \
      security.scan="enabled"

# Configurar permissões e segurança do nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx

# Copiar arquivos buildados
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Instalar gettext (contém envsubst) para processar templates
RUN apk add --no-cache gettext

# Copiar configuração do nginx como template (será processado pelo script de entrada)
COPY --chown=nginx:nginx nginx.conf /etc/nginx/templates/default.conf.template

# Criar script de entrada que define valores padrão e processa template com envsubst
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_HOST="${BACKEND_HOST:-backend}"' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_PORT="${BACKEND_PORT:-8080}"' >> /docker-entrypoint.sh && \
    echo 'echo "=== Configurando Nginx ==="' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_HOST=${BACKEND_HOST}"' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_PORT=${BACKEND_PORT}"' >> /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$$BACKEND_HOST $$BACKEND_PORT'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "=== Nginx configurado ==="' >> /docker-entrypoint.sh && \
    echo 'cat /etc/nginx/conf.d/default.conf | grep proxy_pass' >> /docker-entrypoint.sh && \
    echo 'echo "=== Iniciando Nginx ==="' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Remover arquivos desnecessários e limpar cache
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/* && \
    find /usr/share/nginx/html -name "*.map" -delete && \
    find /usr/share/nginx/html -name "*.txt" ! -name "robots.txt" -delete

# Configurações de segurança do nginx (ocultar versão)
RUN sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf || \
    sed -i '/^http {/a\    server_tokens off;' /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

# Healthcheck integrado
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Executar script de entrada que processa template e inicia nginx
CMD ["/docker-entrypoint.sh"]
