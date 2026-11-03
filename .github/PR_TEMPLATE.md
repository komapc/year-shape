# Pull Request: Repository Restructure for Multi-Project Support

## 🎯 Overview

This PR reorganizes the repository structure to support multiple projects, transforming it from a single-project repository into a portfolio-style monorepo. The Year Shape Calendar project has been moved to its own subdirectory.

## 🔄 Breaking Changes

**⚠️ BREAKING CHANGE:** Complete repository restructuring

Users with existing clones will need to update their workflow:

```bash
git pull
cd year-shape-calendar  # New location
npm install
npm run dev
```

## 📁 Changes Summary

### Structure Changes

**Before:**
```
/
├── src/               # Calendar source
├── public/            # Calendar assets
├── package.json       # Calendar dependencies
└── README.md          # Calendar docs
```

**After:**
```
/
├── .github/           # Shared GitHub workflows
├── year-shape-calendar/
│   ├── src/          # Calendar source
│   ├── public/       # Calendar assets
│   ├── package.json  # Calendar dependencies
│   └── README.md     # Calendar docs
└── README.md          # Projects index
```

### Modified Files

- ✅ `.github/workflows/deploy.yml` - Updated paths for new structure
- ✅ `README.md` - New root-level projects portfolio index
- ✅ `year-shape-calendar/QUICKSTART.md` - Added directory navigation step
- ✅ `year-shape-calendar/TESTING.md` - Updated installation paths
- ✅ `year-shape-calendar/REFACTOR_SUMMARY.md` - Updated getting started section

### Removed Files

- ❌ `app.js` - Old implementation
- ❌ `index.html` - Old implementation
- ❌ `styles.css` - Old implementation
- ❌ `NEW_README.md` - Duplicate file
- ❌ `calendar-shape/` - Empty directory
- ❌ `shape-calendar/` - Incomplete implementation
- ❌ `year-viz/` - Duplicate implementation
- ❌ `projects/` - Empty directory
- ❌ `dist/` - Build artifacts (will be regenerated)

### Moved Files

All calendar-specific files moved to `year-shape-calendar/`:
- Source code (`src/`)
- Public assets (`public/`)
- Configuration files (package.json, tsconfig.json, vite.config.ts, etc.)
- Documentation (ARCHITECTURE.md, QUICKSTART.md, etc.)

## ✅ Testing

### Build Verification
```bash
cd year-shape-calendar
npm install
npm run build
```
✅ **Result:** Build successful - all paths and configurations working correctly

### Workflow Verification
- ✅ GitHub Actions workflow updated with new paths
- ✅ Working directory set to `year-shape-calendar`
- ✅ Artifact upload path corrected
- ✅ Cache dependency path updated

## 🎯 Benefits

### For Development
- 📁 **Clear Organization** - Each project in its own directory
- 🏗️ **Scalable Structure** - Easy to add new projects
- 🚀 **Isolated Dependencies** - Each project has its own package.json
- 📚 **Better Documentation** - Root README as portfolio index

### For Users
- 🔍 **Easy Discovery** - Browse all projects from root README
- 📦 **Independent Projects** - Work on one project without affecting others
- 🎯 **Clear Navigation** - Know exactly where each project lives

### For Maintenance
- 🔧 **Easier Updates** - Changes scoped to specific projects
- 🧪 **Better Testing** - Test projects independently
- 📈 **Clearer History** - Git history organized by project

## 🚀 Deployment Impact

### GitHub Pages
No changes to deployment URL or functionality:
- **URL:** https://yearwheel.lipu.dev/ (unchanged)
- **Source:** `year-shape-calendar/dist/` (updated path in workflow)
- **Secrets:** VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY (unchanged)

### GitHub Actions
- ✅ Workflow file remains at `.github/workflows/deploy.yml` (required location)
- ✅ Working directory set to `./year-shape-calendar`
- ✅ Build process unchanged
- ✅ Secrets handling unchanged

## 📋 Checklist

- [x] All files moved to new structure
- [x] Vite config verified
- [x] TypeScript config verified
- [x] Build tested successfully
- [x] GitHub Actions workflow updated
- [x] Documentation updated
- [x] Old/duplicate files removed
- [x] Root README created
- [x] All paths verified
- [x] Commit messages follow conventional commits

## 📖 Documentation Updates

All documentation has been updated to reflect the new structure:

1. **Root README.md** - New projects portfolio index
2. **QUICKSTART.md** - Added navigation step
3. **TESTING.md** - Updated paths
4. **REFACTOR_SUMMARY.md** - Updated instructions
5. **All other docs** - Moved to `year-shape-calendar/`

## 🔮 Future Enhancements

This structure enables:

1. **New Projects** - Easy to add alongside year-shape-calendar
2. **Shared Tools** - Common utilities in root if needed
3. **Independent Versioning** - Each project can have its own versioning
4. **Selective Deployment** - Deploy specific projects independently

## 💡 Migration Guide

### For Existing Users

**Option 1: Fresh Clone (Recommended)**
```bash
rm -rf year-shape
git clone https://github.com/komapc/year-shape.git
cd year-shape/year-shape-calendar
npm install
npm run dev
```

**Option 2: Update Existing Clone**
```bash
cd year-shape
git pull
cd year-shape-calendar
npm install
npm run dev
```

### For Contributors

Update your local branch:
```bash
git fetch origin
git rebase origin/main
cd year-shape-calendar
npm install
```

## 🎉 Summary

This PR successfully reorganizes the repository into a scalable multi-project structure while maintaining full functionality of the Year Shape Calendar project. All tests pass, documentation is updated, and the deployment process remains unchanged.

**Ready to merge! 🚀**

---

## 📸 Screenshots

### Before (Single Project)
```
/
├── src/
├── public/
├── package.json
└── README.md (project-specific)
```

### After (Multi-Project Portfolio)
```
/
├── .github/
├── year-shape-calendar/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md (project-specific)
└── README.md (portfolio index)
```

---

**Questions?** Please review the updated documentation or leave a comment!

