# Contributing to YearWheel

Thank you for your interest in contributing to YearWheel! This document provides guidelines for contributing to the project.

## 🚫 Golden Rule: NEVER Direct Push to Main or Staging

**ALWAYS create a Pull Request, NEVER push directly:**

```bash
# ❌ NEVER DO THIS:
git checkout main
git merge feature-branch
git push origin main

# ✅ ALWAYS DO THIS:
git checkout feature-branch
gh pr create --base main --title "Feature: Description"
```

**Why?**
- Ensures code review
- Triggers CI/CD checks (tests, build)
- Creates audit trail
- Prevents accidental breaking changes
- Allows discussion and feedback

## Branch Protection

Both `main` and `staging` branches should have protection rules requiring:
- ✅ Pull request reviews
- ✅ Status checks to pass (tests, build)
- ✅ Branch up to date before merge
- ❌ No direct pushes

## Workflow

### 1. Create Feature Branch from Staging

```bash
git checkout staging
git pull origin staging
git checkout -b feature/my-feature
```

### 2. Develop and Test Locally

```bash
npm run dev        # Development server
npm run test:run   # Run tests
npm run build      # Test production build
```

### 3. Commit Changes

```bash
git add .
git commit -m "Feature: Add my feature"
```

Follow commit message conventions:
- `Feature: ...` - New features
- `Fix: ...` - Bug fixes
- `Docs: ...` - Documentation
- `UX: ...` - UX improvements
- `Setup: ...` - Infrastructure
- `Release: ...` - Version releases

### 4. Push and Create PR to Staging

```bash
git push -u origin feature/my-feature
gh pr create --base staging --title "Feature: My Feature"
```

**DO NOT push to staging directly!**

### 5. Test on Staging Preview

- Cloudflare creates preview URL: `https://feature-my-feature.yearwheel.pages.dev/`
- Test thoroughly before merging

### 6. After Review and Approval, Merge PR

- PR is merged to `staging`
- Staging auto-deploys: https://staging.yearwheel.pages.dev/

### 7. Promote to Production

When staging is stable:

```bash
git checkout staging
gh pr create --base main --title "Release: v0.X.X" --body "
## Release v0.X.X

### Features
- Feature 1
- Feature 2

### Bug Fixes
- Fix 1

### Testing
- [x] Tested on staging
- [x] All tests passing
"
```

**DO NOT merge staging to main directly!**

## Code Review Guidelines

### For Reviewers

Check:
- [ ] Code follows TypeScript/TailwindCSS conventions
- [ ] JSDoc comments on new methods
- [ ] Tests added for new utilities
- [ ] Build succeeds
- [ ] All tests pass
- [ ] No console errors
- [ ] Tested on preview URL
- [ ] Documentation updated if needed
- [ ] Version bumped if appropriate

### For Contributors

Before requesting review:
- [ ] Code is clean and well-documented
- [ ] All tests pass locally
- [ ] Build succeeds
- [ ] No linter errors
- [ ] Tested in browser (multiple if possible)
- [ ] Updated documentation
- [ ] Descriptive PR title and description

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR (x.0.0):** Breaking changes, major redesigns
- **MINOR (0.x.0):** New features, significant improvements
- **PATCH (0.0.x):** Bug fixes, minor tweaks

Update version in:
- `package.json`
- `src/index.html` (footer)
- Root `README.md`
- `CHANGELOG.md`

## Pull Request Template

Use `.github/PR_TEMPLATE.md` for consistent PR descriptions.

## Testing Requirements

All PRs must:
- ✅ Pass all unit tests (`npm run test:run`)
- ✅ Build successfully (`npm run build`)
- ✅ Have no TypeScript errors
- ✅ Be tested on preview URL

## Documentation

Update documentation when:
- Adding new features
- Changing architecture
- Modifying workflows
- Updating dependencies

## Emergency Hotfixes

For critical production bugs ONLY:

```bash
# Create from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix, test, PR to main
gh pr create --base main --title "Hotfix: Critical Bug"

# After merge, backport to staging
git checkout staging
git cherry-pick <commit-hash>
gh pr create --base staging --title "Backport: Hotfix"
```

Even hotfixes require PRs (but can be fast-tracked with immediate review).

## Questions?

- Open an issue: https://github.com/komapc/year-shape/issues
- Check docs: `DEPLOYMENT.md`, `DOCUMENTATION.md`

---

**Remember: ALWAYS use Pull Requests. NEVER push directly to main or staging!** 🚫➡️✅

