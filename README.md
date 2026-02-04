# SEPLAG - Sistema de Álbuns Musicais

Aplicação Full Stack para gerenciamento de artistas e álbuns musicais, com armazenamento de capas em MinIO.

## Pré-requisitos

- **Java 17** (para execução local do backend)
- **Node.js 18+** (para execução local do frontend)
- **Docker e Docker Compose** (para execução containerizada)
- **PostgreSQL 15** (ou via Docker)
- **MinIO** (ou via Docker)

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `SPRING_DATASOURCE_URL` | URL do PostgreSQL | `jdbc:postgresql://localhost:5432/seplag_db` |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco | `seplag_user` |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco | `seplag_pass` |
| `MINIO_ENDPOINT` | URL do MinIO | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | Chave de acesso MinIO | `minioadmin` |
| `MINIO_SECRET_KEY` | Chave secreta MinIO | `minioadmin` |
| `JWT_SECRET` | Chave secreta para JWT | `seplag-secret-key-change-in-production` |
| `JWT_EXPIRATION` | Expiração do token (ms) | `300000` |
| `FRONTEND_URL` | URL do frontend (CORS) | `http://localhost:3000` |

## Execução com Docker

Na raiz do projeto:

```bash
docker compose up -d --build
```

Serviços disponíveis:

| Serviço | URL | Porta |
|---------|-----|-------|
| Backend API | http://localhost:8080 | 8080 |
| Frontend | http://localhost:3000 | 3000 |
| Swagger UI | http://localhost:8080/swagger-ui.html | - |
| MinIO Console | http://localhost:9001 | 9001 |
| PostgreSQL | localhost:5432 | 5432 |

## Execução Local

### 1. Banco de dados e MinIO

Subir apenas Postgres e MinIO:

```bash
docker compose up -d postgres minio
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Ou no Windows:

```bash
cd backend
mvnw.cmd spring-boot:run
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentação da API (Swagger)

Com o backend rodando, acesse:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs

### Resposta paginada (listagens)

Endpoints de listagem retornam `PageResponseDTO`:
```json
{
  "content": [...],
  "number": 0,
  "size": 10,
  "totalElements": 100,
  "totalPages": 10,
  "first": true,
  "last": false
}
```

### Contratos de entrada (exemplos)

**Criar álbum** (POST `/api/v1/albuns`):
```json
{
  "titulo": "Nome do álbum",
  "artistaId": 1,
  "dataLancamento": "2024-01-15"
}
```

**Criar artista** (POST `/api/v1/artistas`):
```json
{
  "nome": "Nome do artista",
  "genero": "Rock",
  "biografia": "Biografia opcional"
}
```

## Usuário Padrão

Após a primeira execução (migrations aplicadas):

- **Usuário:** `admin`
- **Senha:** `admin123`

## Estrutura do Projeto

```
carlosdanielalvesdias068174/
├── backend/          # API Spring Boot (Java 17)
│   ├── src/
│   └── pom.xml
├── frontend/         # Interface React + TypeScript
├── docker-compose.yml
└── README.md
```

## Testes

```bash
cd backend
./mvnw test
```
