# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar apenas arquivos necessários para build (melhor cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

# Labels de segurança e metadados
LABEL maintainer="SEPLAG Team" \
      description="Backend API Spring Boot" \
      version="1.0" \
      security.scan="enabled"

# Instalar apenas ferramentas essenciais para healthcheck e remover após uso
RUN apk add --no-cache wget && \
    addgroup -S springboot && \
    adduser -S springboot -G springboot && \
    mkdir -p /app && \
    chown -R springboot:springboot /app

WORKDIR /app

# Copiar apenas o JAR necessário
COPY --from=build --chown=springboot:springboot /app/target/*.jar app.jar

# Limpar cache e arquivos temporários
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Mudar para usuário não-root
USER springboot

# Expor porta
EXPOSE 8080

# Healthcheck integrado (wget mantido apenas para healthcheck)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health/liveness || exit 1

# Configurações de segurança JVM
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -XX:+ExitOnOutOfMemoryError \
    -Djava.security.egd=file:/dev/./urandom \
    -Dfile.encoding=UTF-8"

# Executar aplicação
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
