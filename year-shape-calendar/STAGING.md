# Staging Environment Guide

## Overview

YearWheel uses a two-tier deployment strategy to prevent breaking production during development.

## Important: GitHub Pages Limitation

**GitHub Pages only supports ONE deployment URL per repository.**

This means we have three options:

### Option 1: GitHub Environments (Protection Only)
- Both staging and main deploy to same URL
- Use GitHub Environments for deployment protection/approval
- Staging = testing branch, not separate URL
- **Benefit:** Simple, no extra setup
- **Limitation:** Can't test both versions simultaneously

### Option 2: Separate Staging Repository
- Create `komapc/year-shape-staging` repository
- Staging branch auto-deploys there
- **Benefit:** True separate URLs
- **Limitation:** Manage two repos

### Option 3: Use Vercel for Staging (Recommended)
- Keep GitHub Pages for production
- Use Vercel (free) for staging
- **Benefit:** Best DX, preview URLs for every PR
- **Limitation:** Requires Vercel account

## Current Implementation

We've set up **Option 1** (GitHub Environments) with workflow files for both, but **you'll need to choose** which deployment strategy to use:

### Files Created

- `.github/workflows/deploy-staging.yml` - Staging workflow (disabled by default)
- `.github/workflows/deploy.yml` - Production workflow (active)
- `DEPLOYMENT.md` - Comprehensive deployment guide

### To Activate Full Staging (Choose One)

**A. Use GitHub Environments (Simple)**
1. Keep only `deploy.yml` workflow
2. Delete `deploy-staging.yml`
3. Use branch protection on `main`
4. Test on `staging` branch locally before merging to `main`

**B. Create Separate Staging Repo**
1. Create new repo: `komapc/year-shape-staging`
2. Update `deploy-staging.yml` to deploy to that repo
3. Keep both workflows

**C. Use Vercel for Staging (Best DX)**
1. Sign up for Vercel (free)
2. Connect GitHub repo
3. Configure Vercel to deploy `staging` branch
4. Keep `deploy.yml` for production
5. Delete `deploy-staging.yml`

## Recommended Workflow (Option A - Simple)

Until you set up separate staging URL:

### Development Process

```bash
# 1. Create feature branch from staging
git checkout staging
git pull
git checkout -b feature/my-feature

# 2. Develop and test locally
npm run dev

# 3. Create PR to staging
gh pr create --base staging

# 4. After merge, test locally on staging branch
git checkout staging
git pull
npm run build
npm run preview  # Test production build locally

# 5. When ready, promote to production
gh pr create --base main --title "Release: v0.X.X"
```

### Branch Protection

Set up in GitHub Settings → Branches:

**`main` (Production):**
- ✅ Require PR reviews
- ✅ Require status checks (tests)
- ✅ Require branch up to date
- ❌ No direct pushes

**`staging` (Testing):**
- ✅ Require status checks (tests)
- ✅ Allow direct pushes (for quick fixes)

## Next Steps

1. **Decide which option you want** (A, B, or C above)
2. **Configure GitHub environments:**
   - Go to Settings → Environments
   - Create "production" environment
   - Add branch protection: only `main`
3. **Set branch protection rules** as described above
4. **Test the workflow** with a small PR to staging

## Testing the Setup

### Test Staging Branch

```bash
# Switch to staging
git checkout staging

# Make a small change (e.g., update footer text)
# Commit and push
git push

# Verify:
# - GitHub Actions run
# - Build succeeds
# - No deployment (if Option A)
# - Deployment to staging URL (if Option B or C)
```

### Test Production Release

```bash
# Create PR from staging to main
gh pr create --base main --title "Test: Staging setup"

# After merge:
# - GitHub Actions run
# - Tests pass
# - Deploy to https://komapc.github.io/year-shape/
```

## Summary

**What's Ready:**
- ✅ Staging branch created
- ✅ Workflow files ready
- ✅ Documentation complete
- ✅ Vite config supports dynamic base URL

**What You Need to Decide:**
- Choose deployment strategy (A, B, or C)
- Configure GitHub repository settings
- Set up branch protections

**Recommended Next Action:**
Start with Option A (simple), then upgrade to Option C (Vercel) later if needed.

