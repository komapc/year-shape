# YearWheel Deployment Guide

## Overview

YearWheel uses a two-tier deployment strategy with separate staging and production environments for safe, controlled releases.

## Branch Strategy

```
Feature Branch → staging → main
     ↓             ↓         ↓
  Local Test   Staging  Production
```

### Branches

- **`main`** - Production (https://komapc.github.io/year-shape/)
- **`staging`** - Staging environment (https://komapc.github.io/year-shape-staging/)
- **`feature/*`** - Development branches (local testing)

## Environments

### Production
- **URL:** https://yearwheel.pages.dev/
- **Branch:** `main`
- **Platform:** Cloudflare Pages
- **Protection:** Requires PR review, passing tests
- **Deploy:** Automatic on merge to `main`

### Staging
- **URL:** https://staging.yearwheel.pages.dev/
- **Branch:** `staging`
- **Platform:** Cloudflare Pages
- **Protection:** Requires passing tests
- **Deploy:** Automatic on push to `staging`

### PR Previews
- **URL:** `https://<branch-name>.yearwheel.pages.dev/`
- **Platform:** Cloudflare Pages
- **Deploy:** Automatic for every PR (production and staging)

## Deployment Workflows

### 1. Normal Feature Development

```bash
# Start from staging
git checkout staging
git pull origin staging

# Create feature branch
git checkout -b feature/my-feature

# Develop and test locally
npm run dev

# Run tests
npm run test:run

# Commit changes
git add .
git commit -m "Feature: Add my feature"

# Push and create PR to staging
git push -u origin feature/my-feature
gh pr create --base staging --title "Feature: Add my feature"

# After PR is merged, staging auto-deploys
# Test at: https://komapc.github.io/year-shape-staging/
```

### 2. Staging to Production Release

```bash
# Ensure staging is stable and tested
# Create release PR
git checkout staging
git pull origin staging

# Create PR from staging to main
gh pr create --base main --title "Release: v0.5.2" --body "
## Release v0.5.2

### Features
- Feature 1
- Feature 2

### Bug Fixes
- Fix 1
- Fix 2

### Testing
- [x] Tested on staging
- [x] All tests passing
- [x] Manual QA complete
"

# After review and merge, production auto-deploys
```

### 3. Emergency Hotfix

For critical production bugs that can't wait for the normal staging process:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the bug
# Test locally
npm run dev
npm run test:run

# Commit and push
git add .
git commit -m "Hotfix: Fix critical bug"
git push -u origin hotfix/critical-bug

# Create PR directly to main (bypass staging)
gh pr create --base main --title "Hotfix: Critical Bug" --body "
## Emergency Hotfix

**Issue:** Critical bug description
**Impact:** Production users affected
**Fix:** Description of fix
**Testing:** How it was tested

⚠️ This bypasses staging due to emergency nature
"

# After merge, backport to staging
git checkout staging
git pull origin staging
git cherry-pick <hotfix-commit-hash>
git push origin staging
```

## CI/CD Pipeline

### Staging Pipeline (.github/workflows/deploy-staging.yml)

Triggered on: Push to `staging` branch

Steps:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (`npm run test:run`)
5. Build with staging config (`VITE_BASE_URL=/year-shape-staging/`)
6. Deploy to GitHub Pages staging environment

### Production Pipeline (.github/workflows/deploy.yml)

Triggered on: Push to `main` branch

Steps:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (`npm run test:run`)
5. Build with production config (`VITE_BASE_URL=/year-shape/`)
6. Deploy to GitHub Pages production environment

## GitHub Repository Settings

### Required Environments

Create these environments in GitHub: Settings → Environments

**1. staging**
- Deployment branch: `staging`
- URL: https://komapc.github.io/year-shape-staging/

**2. production** (github-pages)
- Deployment branch: `main` only
- URL: https://komapc.github.io/year-shape/
- Optional: Add required reviewers
- Optional: Add deployment protection rules

### Branch Protection Rules

Configure in GitHub: Settings → Branches

**`main` branch:**
- ✅ Require pull request reviews (1 approver recommended)
- ✅ Require status checks to pass: `build` and `test`
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing (except for admins in emergencies)

**`staging` branch:**
- ✅ Require status checks to pass: `build` and `test`
- ⚠️ Allow direct pushes (optional, for rapid iteration)

## Environment Variables

### GitHub Secrets (Required)

Set these in GitHub: Settings → Secrets and variables → Actions

- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `VITE_GOOGLE_API_KEY` - Google Calendar API Key

These are automatically injected during build in both environments.

### Local Development

Create `.env.local` for local testing (never commit):

```bash
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

## Testing Before Deployment

### Local Testing
```bash
npm run dev          # Dev server
npm run test         # Watch mode
npm run test:run     # Single run
npm run test:ui      # Visual UI
```

### Staging Testing

After merge to `staging`:
1. Wait for deployment (check Actions tab)
2. Visit https://komapc.github.io/year-shape-staging/
3. Test all features thoroughly
4. Check browser console for errors
5. Test on multiple browsers/devices

### Pre-Production Checklist

Before promoting staging to production:
- [ ] All tests passing
- [ ] Manual QA complete on staging
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile/responsive tested
- [ ] Google Calendar integration working
- [ ] All new features documented
- [ ] Version number updated

## Rollback Procedures

### If Production is Broken

**Option 1: Revert the merge commit**
```bash
git checkout main
git revert -m 1 <merge-commit-hash>
git push origin main
# This triggers automatic redeployment of previous version
```

**Option 2: Cherry-pick working version**
```bash
git checkout main
git reset --hard <last-working-commit>
git push --force origin main
# ⚠️ Use with caution, coordinate with team
```

### If Staging is Broken

No problem! Staging is meant to break. Fix it with a new PR or direct push:
```bash
git checkout staging
git revert <bad-commit>
# or
git reset --hard <working-commit>
git push --force origin staging  # Safe for staging
```

## Monitoring

### Deployment Status

Check deployment status:
- GitHub Actions: https://github.com/komapc/year-shape/actions
- Production: Settings → Pages
- Staging: Settings → Environments → staging

### Build Logs

If deployment fails:
1. Go to Actions tab
2. Click failed workflow run
3. Expand failed step
4. Check error logs

## Best Practices

1. **Always develop from `staging`**, not `main`
2. **Test on staging** before promoting to production
3. **Keep PRs small** and focused
4. **Write descriptive commit messages**
5. **Run tests locally** before pushing
6. **Update version numbers** in releases
7. **Document breaking changes** in PR descriptions
8. **Never force-push to `main`**
9. **Use hotfix workflow** only for true emergencies
10. **Keep staging and main in sync** (backport fixes)

## Troubleshooting

### Deployment Not Triggering

Check:
- Workflow file syntax is valid
- Branch name matches trigger
- GitHub Actions are enabled
- Permissions are correct

### Build Failing

Common issues:
- TypeScript errors: Run `npm run build` locally
- Test failures: Run `npm run test:run` locally
- Missing dependencies: Delete `node_modules`, run `npm ci`
- Environment variables: Check GitHub Secrets

### Wrong Base URL

If assets are 404:
- Check `VITE_BASE_URL` in workflow
- Check `vite.config.ts` base path
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

## Support

For issues or questions:
- GitHub Issues: https://github.com/komapc/year-shape/issues
- GitHub Discussions: https://github.com/komapc/year-shape/discussions

