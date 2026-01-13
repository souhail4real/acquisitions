# Acquisitions API

A secure, production-ready RESTful API for user management and authentication built with Express.js and Neon PostgreSQL.

[![Lint & Format](https://github.com/souhail4real/acquisitions/actions/workflows/lint-and-format.yml/badge.svg)](https://github.com/souhail4real/acquisitions/actions/workflows/lint-and-format.yml)
[![Tests](https://github.com/souhail4real/acquisitions/actions/workflows/tests.yml/badge.svg)](https://github.com/souhail4real/acquisitions/actions/workflows/tests.yml)
[![Docker Build](https://github.com/souhail4real/acquisitions/actions/workflows/docker-build-and-push.yml/badge.svg)](https://github.com/souhail4real/acquisitions/actions/workflows/docker-build-and-push.yml)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Scripts Reference](#scripts-reference)
- [Database & Migrations](#database--migrations)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Security](#security)

---

## Overview

Acquisitions is a backend API service that provides:

- **User Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **User Management**: CRUD operations for user accounts with role-based access control
- **Security**: Rate limiting, input validation, CORS, and protection against common attacks

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js 5.x |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Authentication | JWT + HTTP-only Cookies |
| Validation | Zod |
| Logging | Winston + Morgan |

---

## Features

- ✅ JWT authentication with secure cookie management
- ✅ Role-based access control (user/admin)
- ✅ Rate limiting per endpoint
- ✅ SQL injection & XSS protection
- ✅ Request validation with Zod schemas
- ✅ Structured logging with Winston
- ✅ Health check endpoint
- ✅ Docker support with multi-stage builds
- ✅ CI/CD with GitHub Actions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS SERVER                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     MIDDLEWARE STACK                         │    │
│  │  Helmet → CORS → JSON Parser → Cookie Parser → Morgan       │    │
│  │  Security → Rate Limiter → Input Validation → Auth          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                    │                                 │
│                                    ▼                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Routes    │───▶│ Controllers │───▶│  Services   │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                              │                       │
└──────────────────────────────────────────────│───────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DRIZZLE ORM + NEON DATABASE                     │
│                        (PostgreSQL Serverless)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Request arrives** → Helmet adds security headers
2. **CORS check** → Validates origin
3. **Body parsing** → JSON/URL-encoded data parsed
4. **Security middleware** → Threat detection (SQL injection, XSS)
5. **Rate limiting** → Request quota enforcement
6. **Input validation** → Zod schema validation
7. **Authentication** → JWT token verification (if required)
8. **Route handler** → Controller processes request
9. **Service layer** → Business logic execution
10. **Database** → Drizzle ORM queries Neon PostgreSQL
11. **Response** → JSON response sent to client

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A [Neon](https://neon.tech) account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/souhail4real/acquisitions.git
cd acquisitions

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (See Environment Configuration section below)

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The server will start at `http://localhost:3000`.

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-super-secret-key-min-32-characters` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Winston log level | `debug` |

### Example `.env` Files

**Development** (`.env` or `.env.development`):
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=dev-secret-key-for-local-development-only
```

**Production** (`.env.production`):
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<generate-with-openssl-rand-base64-64>
```

> ⚠️ **Never commit `.env` files to version control.** Use `.env.example` as a template.

---

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Health check with uptime |
| `GET` | `/api` | API status |

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/sign-up` | Register new user | No |
| `POST` | `/api/auth/sign-in` | Login and get JWT | No |
| `POST` | `/api/auth/sign-out` | Logout (clear cookie) | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/users/profile` | Get current user profile | Yes | Any |
| `GET` | `/api/users` | List all users | Yes | Admin |
| `GET` | `/api/users/:id` | Get user by ID | Yes | Admin |
| `PUT` | `/api/users/:id` | Update user | Yes | Owner/Admin |
| `DELETE` | `/api/users/:id` | Delete user | Yes | Admin |

---

## Scripts Reference

| Script | Command | Description | When to Use |
|--------|---------|-------------|-------------|
| `start` | `npm start` | Start production server | Production deployment |
| `dev` | `npm run dev` | Start with hot reload | Local development |
| `test` | `npm test` | Run test suite | Before commits/CI |
| `lint` | `npm run lint` | Check code quality | Before commits |
| `lint:fix` | `npm run lint:fix` | Fix linting issues + format | Fix issues |
| `format` | `npm run format` | Format code with Prettier | Code formatting |
| `format:check` | `npm run format:check` | Check formatting | CI validation |
| `db:generate` | `npm run db:generate` | Generate migration files | After schema changes |
| `db:migrate` | `npm run db:migrate` | Apply migrations | Setup/updates |
| `db:studio` | `npm run db:studio` | Open Drizzle Studio GUI | Database inspection |
| `docker:dev` | `npm run docker:dev` | Start Docker dev environment | Docker development |
| `docker:prod` | `npm run docker:prod` | Start Docker prod environment | Docker production |

---

## Database & Migrations

### Technology

- **Database**: PostgreSQL (via [Neon](https://neon.tech) serverless)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - TypeScript-first, lightweight
- **Migrations**: Drizzle Kit for schema management

### Schema Location

```
src/models/user.model.js    # User schema definition
drizzle/                    # Migration files
├── 0000_*.sql             # Initial migration
├── 0001_*.sql             # Subsequent migrations
└── meta/                  # Migration metadata
```

### Migration Commands

```bash
# Generate migration after schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

### Database Configuration

Drizzle configuration is in `drizzle.config.js`:

```javascript
export default {
  schema: './src/models/*.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
```

---

## Docker Deployment

### Quick Start

```bash
# Build the image
docker build -t acquisitions .

# Run the container
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  --name acquisitions-app \
  acquisitions
```

### Docker Compose

**Development:**
```bash
docker compose -f docker-compose.dev.yml up --build
```

**Production:**
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Pre-built Image

Pull from Docker Hub:
```bash
docker pull souhail4real/acquisitions:latest
```

### Dockerfile Features

- **Multi-stage build**: Smaller production image
- **Non-root user**: Security best practice
- **Health check**: Built-in container health monitoring
- **Optimized layers**: npm ci with --omit=dev

---

## Project Structure

```
acquisitions/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup
│   ├── index.js               # Entry point
│   ├── config/
│   │   ├── database.js        # Drizzle + Neon setup
│   │   ├── env.js             # Environment validation
│   │   └── logger.js          # Winston logger config
│   ├── controllers/
│   │   ├── auth.controller.js # Authentication handlers
│   │   └── users.controller.js# User CRUD handlers
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT verification
│   │   ├── rateLimiter.middleware.js
│   │   ├── security.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   └── user.model.js      # Drizzle schema
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth routes
│   │   └── users.routes.js    # /api/users routes
│   ├── services/
│   │   ├── auth.service.js    # Auth business logic
│   │   └── users.service.js   # User business logic
│   ├── utils/
│   │   ├── cookies.js         # Cookie helpers
│   │   ├── format.js          # Response formatting
│   │   └── jwt.js             # JWT utilities
│   └── validations/
│       ├── auth.validation.js # Auth request schemas
│       └── users.validation.js# User request schemas
├── test/
│   └── simple.test.js         # Test suite
├── drizzle/                   # Migration files
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.*.yml       # Docker Compose configs
├── Dockerfile                 # Container definition
├── drizzle.config.js          # Drizzle configuration
├── eslint.config.js           # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .env.example               # Environment template
└── package.json               # Dependencies & scripts
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5.x | Web framework |
| `@neondatabase/serverless` | 1.x | Neon PostgreSQL driver |
| `drizzle-orm` | 0.45.x | Database ORM |
| `bcrypt` | 6.x | Password hashing |
| `jsonwebtoken` | 9.x | JWT authentication |
| `zod` | 4.x | Schema validation |
| `helmet` | 8.x | Security headers |
| `cors` | 2.x | CORS middleware |
| `cookie-parser` | 1.x | Cookie parsing |
| `morgan` | 1.x | HTTP request logging |
| `winston` | 3.x | Application logging |
| `dotenv` | 17.x | Environment variables |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | 9.x | Code linting |
| `prettier` | 3.x | Code formatting |
| `eslint-config-prettier` | 10.x | ESLint + Prettier integration |
| `eslint-plugin-prettier` | 5.x | Run Prettier as ESLint rule |
| `drizzle-kit` | 0.31.x | Database migrations |

---

## Security

### Built-in Protections

| Feature | Implementation |
|---------|----------------|
| **Rate Limiting** | In-memory limiter (5 req/15min auth, 100 req/15min API) |
| **Input Validation** | SQL injection, NoSQL injection, XSS detection |
| **CORS** | Configurable origin whitelist |
| **Helmet** | Security headers (CSP, X-Frame-Options, etc.) |
| **Password Hashing** | bcrypt with salt rounds |
| **JWT** | HTTP-only cookies, configurable expiration |
| **Role-Based Access** | User/Admin role authorization |

### Security Best Practices

1. **Never commit `.env` files** - Use environment variables
2. **Generate strong JWT secrets** - `openssl rand -base64 64`
3. **Use HTTPS in production** - SSL/TLS termination
4. **Keep dependencies updated** - Regular `npm audit`
5. **Review rate limit settings** - Adjust for your traffic

---

## CI/CD

Three GitHub Actions workflows are configured:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Lint & Format** | Push/PR to main, staging | Code quality checks |
| **Tests** | Push/PR to main, staging | Run test suite |
| **Docker Build** | Push to main | Build & push to Docker Hub |

### Required Secrets

Configure in GitHub Repository Settings → Secrets:

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |

---

## License

ISC

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/souhail4real/acquisitions/issues)
- **Repository**: [github.com/souhail4real/acquisitions](https://github.com/souhail4real/acquisitions)
