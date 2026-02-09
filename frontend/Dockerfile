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
    chmod -R 755 /var/log/nginx && \
    mkdir -p /etc/nginx/templates

# Copiar arquivos buildados
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copiar template do nginx (será processado pelo entrypoint com envsubst)
COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/templates/default.conf.template

# Copiar entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Remover arquivos desnecessários e limpar cache
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/* && \
    find /usr/share/nginx/html -name "*.map" -delete && \
    find /usr/share/nginx/html -name "*.txt" ! -name "robots.txt" -delete

# Configurações de segurança do nginx (ocultar versão)
RUN sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf || \
    sed -i '/^http {/a\    server_tokens off;' /etc/nginx/nginx.conf

# Variáveis de ambiente padrão para o backend (podem ser sobrescritas no docker-compose/Coolify)
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080

# Expor porta
EXPOSE 80

# Healthcheck integrado
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Usar entrypoint customizado que processa o template antes de iniciar o nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
