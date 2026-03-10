# Data Directory Cleanup Notes

## Optional Cleanup (Can Delete Safely)

### sources_old/
Old format source files (before unified JSON format). Can be deleted after verifying new sources work.

**Files:**
- `source_en_pivot.json` (138 KB)
- `source_io_wikipedia.json` (1.2 MB)
- `source_io_wiktionary.json` (11 MB)

**Action:** Delete after verifying regeneration works
```bash
rm -rf projects/data/sources_old/
```

### work/
Temporary working directory from old extraction process.

**Files:**
- `eo_wikt_eo_io.json` (433 KB)

**Action:** Can be deleted
```bash
rm -rf projects/data/work/
```

### __pycache__/
Python bytecode cache. Automatically regenerated.

**Action:** Already in .gitignore, can delete locally
```bash
find projects/data -type d -name __pycache__ -exec rm -rf {} +
```

## Keep (Required)

- `sources/` - Current unified format sources ✅
- `merged/` - Merged files (regenerated but useful) ✅
- `generated/` - Generated DIX files ✅
- `scripts/` - Generation pipeline ✅
- `schema.json` - JSON schema ✅
- `README.md` - Documentation ✅
- `REFACTORING_PLAN.md` - Reference doc ✅
- `BIDIX_POS_INVESTIGATION.md` - Investigation findings ✅






