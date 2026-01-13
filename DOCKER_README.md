# Docker Setup for Acquisitions API

This document explains how to run the Acquisitions API using Docker with Neon Database for both development and production environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- A [Neon](https://neon.tech) account with a project created

## Quick Start

### Development (with Neon Local)

```bash
# 1. Copy and configure environment variables
cp .env.development .env

# 2. Edit .env with your Neon credentials (see Configuration section below)

# 3. Start the development environment
docker compose -f docker-compose.dev.yml up --build
```

### Production (with Neon Cloud)

```bash
# 1. Set environment variables (use secrets manager in real production)
export DATABASE_URL="postgresql://user:pass@your-endpoint.neon.tech/dbname?sslmode=require"
export JWT_SECRET="your-secure-production-secret"

# 2. Start production environment
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT ENVIRONMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐ │
│  │              │     │              │     │                  │ │
│  │  Your App    │────▶│  Neon Local  │────▶│  Neon Cloud DB   │ │
│  │  Container   │     │   (Proxy)    │     │  (Ephemeral      │ │
│  │              │     │              │     │   Branch)        │ │
│  └──────────────┘     └──────────────┘     └──────────────────┘ │
│                                                                  │
│  DATABASE_URL: postgres://neon:npg@neon-local:5432/neondb       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ENVIRONMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                       ┌──────────────────────┐│
│  │              │                       │                      ││
│  │  Your App    │──────────────────────▶│  Neon Cloud DB       ││
│  │  Container   │                       │  (Production Branch) ││
│  │              │                       │                      ││
│  └──────────────┘                       └──────────────────────┘│
│                                                                  │
│  DATABASE_URL: postgresql://user:pass@endpoint.neon.tech/db     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Getting Neon Credentials

1. **NEON_API_KEY**: 
   - Go to [Neon Console](https://console.neon.tech)
   - Navigate to **Account Settings** → **API Keys**
   - Create a new API key

2. **NEON_PROJECT_ID**:
   - Go to your project in [Neon Console](https://console.neon.tech)
   - Navigate to **Project Settings** → **General**
   - Copy the Project ID

3. **PARENT_BRANCH_ID** (optional):
   - Go to your project → **Branches**
   - Copy the Branch ID you want to use as parent for ephemeral branches
   - If not set, uses your project's default branch

4. **DATABASE_URL** (production):
   - Go to your project → **Connection Details**
   - Copy the connection string (use the pooler endpoint for better performance)

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Environment mode |
| `DATABASE_URL` | Auto-configured | Required | Neon connection string |
| `NEON_API_KEY` | Required | Not needed | Neon API key for local proxy |
| `NEON_PROJECT_ID` | Required | Not needed | Your Neon project ID |
| `PARENT_BRANCH_ID` | Optional | Not needed | Parent branch for ephemeral copies |
| `JWT_SECRET` | Default provided | **Required** | JWT signing secret |
| `USE_NEON_LOCAL` | `true` | `false` | Enable/disable Neon Local proxy |
| `DELETE_BRANCH` | `true` | N/A | Delete ephemeral branch on stop |

---

## Development Environment

### How Neon Local Works

Neon Local creates **ephemeral database branches** that:
- Are automatically created when the container starts
- Are automatically deleted when the container stops
- Contain a full copy of your parent branch data
- Allow safe testing without affecting production

### Starting Development

```bash
# Start with logs visible
docker compose -f docker-compose.dev.yml up --build

# Start in background
docker compose -f docker-compose.dev.yml up --build -d

# View logs
docker compose -f docker-compose.dev.yml logs -f app
```

### Development Features

- **Hot Reloading**: Source code is mounted, changes reflect automatically
- **Ephemeral Branches**: Each `docker compose up` gets a fresh database copy
- **Branch Persistence**: Set `DELETE_BRANCH=false` to keep branches between restarts

### Persisting Branches per Git Branch

To create persistent database branches that match your Git branches:

```yaml
# In docker-compose.dev.yml, the volumes are already configured:
volumes:
  - ./.neon_local/:/tmp/.neon_local
  - ./.git/HEAD:/tmp/.git/HEAD:ro
```

Set `DELETE_BRANCH=false` in your `.env` to enable this feature.

### Running Database Migrations

```bash
# Enter the app container
docker compose -f docker-compose.dev.yml exec app sh

# Run migrations
npm run db:migrate

# Or run from host (if you have the DATABASE_URL set)
npm run db:migrate
```

### Stopping Development

```bash
# Stop and remove containers (ephemeral branch deleted if DELETE_BRANCH=true)
docker compose -f docker-compose.dev.yml down

# Stop but keep containers
docker compose -f docker-compose.dev.yml stop
```

---

## Production Environment

### Deploying to Production

1. **Set Environment Variables**

   Using a `.env` file (not recommended for production):
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

   Using environment variables (recommended):
   ```bash
   export DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require"
   export JWT_SECRET="your-very-secure-production-secret"
   ```

   Using Docker secrets or a secrets manager (best practice):
   ```bash
   # Example with Docker secrets
   echo "your-database-url" | docker secret create database_url -
   echo "your-jwt-secret" | docker secret create jwt_secret -
   ```

2. **Build and Start**

   ```bash
   # Build and start
   docker compose -f docker-compose.prod.yml up --build -d

   # View logs
   docker compose -f docker-compose.prod.yml logs -f

   # Check status
   docker compose -f docker-compose.prod.yml ps
   ```

3. **Run Migrations**

   ```bash
   docker compose -f docker-compose.prod.yml exec app npm run db:migrate
   ```

### Production Best Practices

- ✅ Use environment variables or secrets manager for sensitive data
- ✅ Use the Neon pooler endpoint for better connection handling
- ✅ Enable SSL/TLS (`sslmode=require`)
- ✅ Rotate JWT secrets periodically
- ✅ Set up monitoring and alerting
- ✅ Use health checks (already configured)
- ❌ Never commit `.env.production` with real secrets

### Scaling

```bash
# Scale the app service
docker compose -f docker-compose.prod.yml up -d --scale app=3
```

---

## Useful Commands

### Docker Compose Commands

```bash
# Build without cache
docker compose -f docker-compose.dev.yml build --no-cache

# View running containers
docker compose -f docker-compose.dev.yml ps

# View logs for specific service
docker compose -f docker-compose.dev.yml logs -f neon-local

# Execute command in container
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Remove all containers and volumes
docker compose -f docker-compose.dev.yml down -v
```

### Debugging

```bash
# Check if Neon Local is healthy
docker compose -f docker-compose.dev.yml exec neon-local nc -z localhost 5432

# Check app logs
docker compose -f docker-compose.dev.yml logs app

# Enter app container shell
docker compose -f docker-compose.dev.yml exec app sh

# Check environment variables in container
docker compose -f docker-compose.dev.yml exec app env | grep -E "(DATABASE|NEON|NODE)"
```

---

## Troubleshooting

### Common Issues

**1. Neon Local fails to start**
```
Error: NEON_API_KEY is required
```
Solution: Ensure `NEON_API_KEY` and `NEON_PROJECT_ID` are set in your `.env` file.

**2. App can't connect to database**
```
Error: Connection refused to neon-local:5432
```
Solution: Wait for Neon Local to be healthy. The app depends on `neon-local` service health check.

**3. SSL Certificate errors**
```
Error: self signed certificate
```
Solution: The app is configured to work with Neon Local's self-signed certificates. Ensure `USE_NEON_LOCAL=true` is set.

**4. Ephemeral branch not created**
```
Error: Branch creation failed
```
Solution: Check your `NEON_API_KEY` permissions and ensure the project ID is correct.

### Getting Help

- [Neon Documentation](https://neon.tech/docs)
- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## File Structure

```
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.dev.yml     # Development with Neon Local
├── docker-compose.prod.yml    # Production with Neon Cloud
├── .dockerignore              # Files excluded from Docker build
├── .env                       # Active environment config (git-ignored)
├── .env.development           # Development template
├── .env.production            # Production template
├── .neon_local/               # Neon Local metadata (git-ignored)
└── DOCKER_README.md           # This file
```

---

## Security Considerations

1. **Never commit secrets** - Use `.gitignore` for all `.env` files except templates
2. **Use secrets managers** in production (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate credentials** regularly
4. **Use non-root user** - The Dockerfile runs as `nodejs` user
5. **Limit resources** - Production compose includes resource limits
6. **Enable health checks** - Both compose files include health checks
