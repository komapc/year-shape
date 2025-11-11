# Version Policy

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backward-compatible functionality
- **PATCH** (0.0.X): Bug fixes, backward-compatible fixes

---

## Version Increment Rules

### 🔄 **Every PR Must Increment Version**

**Before merging any PR:**
1. Update version in `year-shape-calendar/package.json`
2. Update version in `year-shape-calendar/src/index.html` (footer)
3. Document changes in commit message

### Examples

```bash
# Feature PR (new functionality)
0.1.0 → 0.2.0

# Bug fix PR
0.1.0 → 0.1.1

# Breaking change PR
0.1.0 → 1.0.0
```

---

## How to Update Version

### 1. Update package.json

```json
{
  "name": "yearwheel",
  "version": "0.2.0",  // ← Increment here
  ...
}
```

### 2. Update HTML Footer

```html
<span id="appVersion" class="text-primary-400/60">v0.2.0</span>
```

### 3. Commit Message

```bash
git commit -m "chore: bump version to 0.2.0

- Added new feature X
- Fixed bug Y
- Updated documentation"
```

---

## PR Checklist

Before creating a PR:

- [ ] Version incremented in `package.json`
- [ ] Version updated in `src/index.html` footer
- [ ] Changes documented in commit message
- [ ] Build passes (`npm run build`)
- [ ] No linter errors (`npm run lint`)

---

## Current Version: 0.1.0

**Last Updated:** November 11, 2025

---

## Future: Automated Version Management

Consider adding these tools in the future:
- `standard-version` for automatic changelog generation
- GitHub Actions workflow to validate version bump
- Release-please for automated releases

