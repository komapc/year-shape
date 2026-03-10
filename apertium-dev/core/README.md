# Apertium Ido-Esperanto Development

Clean, organized workspace for Ido-Esperanto translation development.

## 📊 Current Statistics (December 2025)

| Metric | Count | Notes |
|--------|-------|-------|
| **Bidix entries** | 28,034 | +106% from unified pipeline |
| **Monodix entries** | 13,002 | 79% morphology coverage |
| **Vortaro words** | 16,402 | Multi-source provenance |
| **Data sources** | 4 | io_wiktionary, io_wikipedia, bert_embeddings, en_pivot |

## 📁 Structure

```
apertium-dev/
├── terraform/             Infrastructure as Code (github.com/komapc/apertium-terraform)
├── apertium/              Official Apertium language pairs (sterile, ready for upstream)
├── projects/              Development tools, apps, and utilities
│   ├── extractor/        Dictionary extraction pipeline
│   ├── translator/       Web UI translator (github.com/komapc/ido-epo-translator)
│   ├── vortaro/          Dictionary viewer (github.com/komapc/vortaro)
│   ├── embedding-aligner/ Embedding alignment tools
│   ├── data/             Generated data and sources
│   └── docs/             Documentation and scripts
```

## 🎯 Quick Links

- **Apertium Pair:** `apertium/apertium-ido-epo/`
- **Extractor:** `projects/extractor/`
- **Translator:** `projects/translator/`
- **Dictionary Viewer:** `projects/vortaro/`
- **Documentation:** `projects/docs/`

## 📚 Documentation

### Core Documentation
- **`TODO.md`** - Current priorities and critical issues
- **`QUICK_START.md`** - Dictionary regeneration guide
- **`projects/docs/archive/PROJECT_FLOW_ANALYSIS.md`** - Complete architecture and flow analysis

### Session Documentation
See `projects/docs/` for session logs and EC2 extraction guides.

## 🚀 Quick Start

### Regenerate Dictionaries (Fastest)
```bash
cd projects/data
python3 scripts/regenerate_all.py  # ~5 seconds
```

### Run Full Extraction
```bash
cd projects/extractor
make regenerate-fast     # ~1 hour
```

### Test Translation
```bash
cd projects/translator
npm start
```

### View Dictionary
```bash
cd projects/vortaro
open index.html
```

## 🔧 Repository Structure

### `apertium/` - Official Apertium Files
- **STERILE** - No custom scripts or utilities
- Ready to push to official Apertium project
- Only standard Apertium structure

### `projects/` - Development Work
- Extraction pipeline and tools
- Web applications
- Development utilities
- Generated data
- Documentation

## 📝 Recent Changes

**December 4, 2025 - Unified JSON Pipeline:**
- ✅ Created unified JSON format for all dictionary sources
- ✅ Implemented automated dictionary regeneration (5 seconds)
- ✅ Increased bidix entries by 60% (8,500 → 13,629)
- ✅ Added multi-source provenance tracking to vortaro
- ✅ Merged 3 PRs across extractor, vortaro, and translator repos

**November 5, 2025 - Root Folder Cleanup:**
- ✅ Removed duplicate directories and organized documentation
- ✅ Updated all path references across documentation and scripts

**October 22, 2025 - Major Reorganization:**
- ✅ Fixed number recognition and separated apertium/ from projects/

## 🎯 Key Points

- **`apertium/`** = Sterile, ready for official Apertium
- **`projects/`** = All development work, tools, and apps
- **Clear separation** = Easy to contribute upstream
- **Docker usage** = APy server containerized (`projects/translator/apy-server/`)

