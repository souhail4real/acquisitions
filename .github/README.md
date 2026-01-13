# GitHub Actions CI/CD Workflows

This project includes three GitHub Actions workflows for continuous integration and deployment:

## 🔍 Lint and Format (`lint-and-format.yml`)

**Triggers:** Push and Pull Requests to `main` and `staging` branches

**What it does:**
- Uses Node.js 20.x with npm caching
- Installs dependencies with `npm ci`
- Runs ESLint with `npm run lint`
- Checks Prettier formatting with `npm run format:check`
- Provides clear error messages and fix suggestions

**Fix Commands:**
- `npm run lint:fix` - Auto-fix ESLint issues and format code
- `npm run format` - Format code with Prettier

## 🧪 Tests (`tests.yml`)

**Triggers:** Push and Pull Requests to `main` and `staging` branches

**What it does:**
- Sets up Node.js 20.x with PostgreSQL 15 for testing
- Configures test environment variables
- Runs database migrations if available
- Executes tests with `npm test`
- Uploads coverage reports (30-day retention)
- Generates GitHub step summary with test results

**Environment Variables:**
- `NODE_ENV=test`
- `NODE_OPTIONS=--experimental-vm-modules`
- `DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db`

## 🐳 Docker Build and Push (`docker-build-and-push.yml`)

**Triggers:** Push to `main` branch and manual dispatch

**What it does:**
- Builds multi-platform Docker images (linux/amd64, linux/arm64)
- Uses Docker Buildx with caching for efficiency
- Logs in to Docker Hub using secrets
- Generates metadata with tags and labels
- Pushes to Docker Hub registry
- Creates comprehensive build summary

**Required Secrets:**
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token

**Generated Tags:**
- `latest` (main branch only)
- `main-<commit-sha>`
- `prod-YYYYMMDD-HHmmss` (main branch only)

## 🛠️ Setup Instructions

### 1. Configure Docker Hub Secrets

Add these secrets to your GitHub repository:
```
Settings → Secrets and Variables → Actions
```

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

### 2. Customize Docker Image Name

Update the `IMAGE_NAME` environment variable in `docker-build-and-push.yml`:
```yaml
env:
  IMAGE_NAME: your-app-name  # Change this to your desired image name
```

### 3. Add Test Files

Create test files in the `test/` directory. The workflow will automatically run them with Node.js built-in test runner.

Example test structure:
```
test/
├── basic.test.js
├── api.test.js
└── database.test.js
```

### 4. Configure Branch Protection

For best practices, enable branch protection rules:
```
Settings → Branches → Add rule
```

- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators

## 📊 Workflow Status

You can monitor workflow status in the Actions tab of your GitHub repository. Each workflow provides:

- ✅ Success/failure status
- 📝 Detailed logs and error messages
- 📦 Artifact uploads (coverage, logs)
- 📋 Step summaries with actionable information

## 🔧 Local Development

Run the same checks locally before pushing:

```bash
# Lint and format
npm run lint
npm run format:check

# Fix issues
npm run lint:fix
npm run format

# Run tests
npm test

# Build Docker image
docker build -t acquisitions:local .
```