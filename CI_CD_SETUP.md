# 🚀 CI/CD Setup Guide

## Current Status

- ✅ **Lint & Format** - Working
- ⚠️ **Tests** - May need attention (check below)
- ⚠️ **Docker Build** - Needs Docker Hub secrets (optional)

## 📍 Where to Find CI/CD Information

### 1. **GitHub Actions Dashboard**

View all workflow runs and errors:

```
https://github.com/souhail4real/acquisitions/actions
```

### 2. **Workflow Files Location**

All CI/CD configurations are in:

```
.github/workflows/
├── lint-and-format.yml    ✅ Working
├── tests.yml              ⚠️ Check logs
└── docker-build-and-push.yml   ⚠️ Needs secrets
```

## 🔧 Required Configuration

### Docker Hub Secrets (Optional - for Docker workflow)

**Where to add:**

```
https://github.com/souhail4real/acquisitions/settings/secrets/actions
```

**Required secrets:**

1. **`DOCKER_USERNAME`**
   - Your Docker Hub username
   - Example: `souhail4real`

2. **`DOCKER_PASSWORD`**
   - Your Docker Hub password OR access token (recommended)
   - Get access token: https://hub.docker.com/settings/security

**Steps to add secrets:**

1. Go to repository settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add `DOCKER_USERNAME` with your Docker Hub username
5. Add `DOCKER_PASSWORD` with your Docker Hub token/password

### Test Workflow Issues

If tests are failing, check:

**Common issues:**

- Database connection errors (PostgreSQL service)
- Missing environment variables
- Import errors in test files

**View detailed logs:**

```
https://github.com/souhail4real/acquisitions/actions/workflows/tests.yml
```

**Fix locally first:**

```bash
npm test
```

## 📊 How to Check CI/CD Status

### Method 1: GitHub Actions Tab

1. Go to your repository
2. Click "Actions" tab
3. See all workflow runs with ✅ or ❌ status

### Method 2: Commit Status

- Green checkmark ✅ = All checks passed
- Red X ❌ = Some checks failed
- Yellow dot 🟡 = Checks running

### Method 3: Email Notifications

GitHub sends emails when workflows fail (check your GitHub email)

## 🐛 Debugging Failed Workflows

### For Tests Workflow:

```bash
# Run locally to see exact error
npm test

# Check if all dependencies are installed
npm ci

# Verify database connection (if needed)
node test-db.js
```

### For Docker Workflow:

```bash
# Test Docker build locally
docker build -t test-acquisitions .

# If it fails, check Dockerfile
docker build -t test-acquisitions . --progress=plain
```

### For Lint/Format:

```bash
# Check linting
npm run lint

# Check formatting
npm run format:check

# Fix automatically
npm run lint:fix
```

## 📝 Quick Reference

| Workflow      | Status        | Action Needed                                     |
| ------------- | ------------- | ------------------------------------------------- |
| Lint & Format | ✅ Working    | None                                              |
| Tests         | ⚠️ Check logs | View error at actions page                        |
| Docker Build  | ⚠️ Optional   | Add Docker Hub secrets if you want to push images |

## 🔗 Important Links

- **Actions Dashboard**: https://github.com/souhail4real/acquisitions/actions
- **Add Secrets**: https://github.com/souhail4real/acquisitions/settings/secrets/actions
- **Workflow Runs**: https://github.com/souhail4real/acquisitions/actions/workflows/
- **Docker Hub**: https://hub.docker.com/

## 💡 Pro Tips

1. **Always check the Actions tab** after pushing to see if workflows pass
2. **Run checks locally first** before pushing:
   ```bash
   npm run lint && npm run format:check && npm test
   ```
3. **Docker secrets are optional** - workflow will build without pushing if secrets are missing
4. **Read the workflow logs** - they contain detailed error messages
5. **Test failures show in the summary** - GitHub creates a summary with test results
