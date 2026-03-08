# TODO - Apertium Ido-Esperanto Development

**Last Updated:** December 4, 2025

## 📋 Quick Reference

This is the master TODO list. For detailed tasks, see:
- **Translator:** `projects/translator/TODO.md`
- **Extractor:** `projects/extractor/TODO.md`
- **Core Apertium:** `apertium/apertium-ido-epo/TODO.md`

---

## 🚨 Critical & Immediate (This Week)

### ✅ 0. Unified JSON Format & DIX Generation - COMPLETE
**Location:** `projects/data/`  
**Status:** ✅ **COMPLETE** (December 4, 2025)  
**Impact:** Automated dictionary regeneration pipeline

- ✅ Created unified JSON format for all sources
- ✅ Implemented intelligent merge with deduplication
- ✅ Generated monodix (8,604 entries) and bidix (13,629 entries)
- ✅ Exported vortaro JSON with multi-source provenance
- ✅ Validated XML output

**Files Created:**
- `projects/data/scripts/generate_monodix.py`
- `projects/data/scripts/generate_bidix.py`
- `projects/data/scripts/regenerate_all.py`
- `projects/data/scripts/export_vortaro.py`

**Results:** 60% more dictionary entries, fully automated regeneration

**Documentation:** `SESSION_2025-12-04_DIX_GENERATION.md`, `CURRENT_STATUS_2025-12-04.md`

---

### 0a. 📈 Improve POS Tag Coverage (NEW)
**Location:** `projects/extractor/`, `projects/data/`  
**Time:** 2-4 hours  
**Priority:** HIGH  
**Impact:** Better translation accuracy

**Current Status:** 40% of entries have POS tags (5,031 out of 12,650)

- [ ] Enhance `io_wiktionary` parser to extract POS from wiktionary entries
- [ ] Add POS inference for `en_pivot` entries based on word endings
- [ ] Extract POS from `ido_lexicon` paradigm information
- [ ] Re-run extraction pipeline with enhanced POS extraction
- [ ] Regenerate dictionaries with improved POS coverage

**Target:** 80-90% POS tag coverage (up from 40%)

**Why:** POS tags improve translation accuracy for complex sentences  
**Benefit:** Better Apertium matching, fewer translation ambiguities

---

### ~~0b. 🔀 Create PRs for Unified Format Changes~~ ✅ COMPLETE
**Priority:** HIGH  
**Status:** ✅ **ALL 3 PRS MERGED** (December 4, 2025)

**Extractor PR #44:** ✅ MERGED
- ✅ Committed changes to `scripts/01_parse_io_wiktionary.py`
- ✅ Committed changes to `scripts/utils/parser_base.py`
- ✅ Committed changes to `scripts/utils/metadata.py`
- ✅ Created PR: "feat: Update parsers to output unified JSON format"
- ✅ Link: https://github.com/komapc/ido-esperanto-extractor/pull/44

**Vortaro PR #37:** ✅ MERGED (+ Emergency Hotfix)
- ✅ Updated vortaro to use new vortaro_dictionary.json format (12,650 entries)
- ✅ Added MULTI_SOURCE_UPDATE.md with implementation guidance
- ✅ Fixed ESLint linting issue
- ✅ Created PR: "feat: Add multi-source provenance data (60% more entries)"
- ✅ Link: https://github.com/komapc/vortaro/pull/37
- ⚠️ **Emergency Hotfix (7f0ea19):** Fixed format incompatibility (bypassed PR workflow)
  - Issue: UI showed only 4 words instead of 12,637
  - Fix: Converted back to legacy format for UI compatibility
  - See: `HOTFIX_2025-12-04_VORTARO.md`

**Translator PR #14:** ✅ MERGED
- ✅ Added DICTIONARY_REGENERATION.md
- ✅ Updated _worker.js and submodule
- ✅ Documented regeneration process
- ✅ Created PR: "docs: Add dictionary regeneration workflow documentation"
- ✅ Link: https://github.com/komapc/ido-epo-translator/pull/14

**Result:** Unified JSON format pipeline fully deployed across all repositories!  
**Note:** Emergency hotfix applied to vortaro for format compatibility (documented)

---

### 0c. 🧪 Test Generated Dictionaries (NEW)
**Location:** `apertium/`  
**Time:** 1-2 hours  
**Priority:** CRITICAL  
**Impact:** Validate 60% dictionary increase

- [ ] Merge paradigm definitions into generated monodix
- [ ] Copy generated dictionaries to apertium directories
- [ ] Recompile apertium-ido and apertium-ido-epo
- [ ] Test basic translations (100 sentences)
- [ ] Compare translation quality: old vs new dictionaries
- [ ] Measure coverage improvement
- [ ] Document any issues found

**Why:** Need to validate generated dictionaries work with Apertium  
**Blocker:** Monodix needs paradigm definitions merged

---

### 0d. 🔤 Fix Case Sensitivity for Proper Nouns (EASY FIX)
**Location:** `projects/data/sources/`, `projects/data/pardefs.xml`  
**Time:** 15-30 minutes  
**Priority:** HIGH (Easiest fix)  
**Impact:** Fixes 3 missing words immediately

**Issue:** Proper nouns like `Ido`, `Paris`, `Idisti` exist in JSON as lowercase but appear capitalized in text. Morphological analyzer requires exact case match.

**Solution:**
- [x] Removed `source_manual.json` - all dictionaries regenerated from sources only
- [x] Added automatic `np__np` paradigm assignment in `merge_sources.py` for entries with `pos: "np"`
- [x] Proper nouns from `source_io_wikipedia.json` now automatically get `np__np` paradigm
- [ ] Regenerate dictionaries: `cd projects/data && python3 scripts/regenerate_all.py`
- [ ] Copy generated files to apertium directories
- [ ] Recompile and test

**IMPORTANT:** 
- Do NOT manually edit .dix files. Always regenerate from JSON sources.
- All source JSON files are generated automatically. No manual entries needed.

**Files:**
- `projects/data/scripts/merge_sources.py` (updated - assigns `np__np` paradigm automatically)
- `projects/data/pardefs.xml` (contains `np__np` paradigm)

**Documentation:** `apertium/apertium-ido-epo/corpus/EASY_FIX_CASE_SENSITIVITY.md`

---

### 0e. 🔧 Fix Missing Dictionary Entries
**Location:** `apertium/apertium-ido/`, `apertium/apertium-ido-epo/`, `projects/data/`  
**Time:** 1-2 hours  
**Priority:** HIGH  
**Impact:** Fixes remaining 3 missing words

**Missing Words:**
- [ ] `kreinto` - Add to monodix and bidix (exists in JSON)
- [ ] `remplacigar` - Add to JSON sources, then monodix and bidix
- [ ] `existant` - Add to JSON sources, then monodix and bidix

**Documentation:** `apertium/apertium-ido-epo/corpus/MISSING_WORDS_ANALYSIS.md`

---

### 0f. ⏰ Fix Tense Translation Errors
**Location:** `apertium/apertium-ido/pardefs.xml`, `apertium/apertium-ido/apertium-ido.ido.dix`  
**Time:** 15-30 minutes  
**Priority:** HIGH  
**Impact:** Fixes past tense verbs being translated as present

**Issue:** Past tense verbs (`partoprenis`, `diskutis`) translated as present tense due to:
1. Wrong tags in paradigm (`pres`/`past`/`fut` instead of `pri`/`pii`/`fti`)
2. Wrong stem in static entry (`partoprenis` instead of `partopren`)

**Solution:**
- [x] Fix `ar__vblex` paradigm tags: `pres`→`pri`, `past`→`pii`, `fut`→`fti` (Updated in `projects/data/pardefs.xml`)
- [x] Fix static entry stem or remove entry (Filtered out conjugated forms in `merge_sources.py`)
- [x] Recompile and test (Verified: `partoprenis` → `partoprenis`)

**Documentation:** `apertium/apertium-ido-epo/corpus/TENSE_ERRORS_FIX.md`

---

### 1. 🔧 Fix Morphological Rules Integration
**Location:** `projects/extractor/`  
**Time:** 2-4 hours  
**Priority:** CRITICAL  
**Impact:** Complete dictionary functionality

- [ ] Update `Makefile` to use `merge_with_extractor.py` instead of `export_apertium.py`
- [ ] Test morphological rules integration with sample data
- [ ] Verify complete dictionary generation includes all paradigms
- [ ] Test verb participles (12 forms: -anta, -inta, -onta, etc.)
- [ ] Test adjective paradigms (4 types: a__adj, ala__adj, oza__adj, iva__adj)
- [ ] Validate number recognition with percentage support

**Why:** ❌ **CRITICAL ISSUE** - Extractor creates incomplete dictionaries without proper morphology  
**Impact:** Missing verb participles, adjective paradigms, advanced number recognition  
**Details:** `projects/docs/archive/EXTRACTOR_MORPHOLOGY_ANALYSIS.md`  
**Files:** `projects/extractor/rules/apertium-ido.ido.dix.rules` (stored separately, not integrated)

---

### 2. 🧹 Fix Dictionary Data Corruption
**Location:** `projects/extractor/scripts/export_apertium.py`  
**Time:** 1-2 hours  
**Priority:** HIGH  
**Impact:** Translation quality

- [ ] Clean metadata markers from bilingual dictionary export
- [ ] Remove `{wikt_io}`, `{wikt_eo}`, `Kategorio:*` markers from translations
- [ ] **Filter out arrows and text in brackets** (e.g., `de ↓ (indikante aganton)`)
- [ ] Test export with sample data to verify clean output
- [ ] Regenerate bilingual dictionary with fixed export
- [ ] Verify translations work correctly (e.g., `du` → `du`, not `du Kategorio:Eo DU{wikt_io}`)

**Why:** Bilingual dictionary has corrupted entries causing translation failures  
**Evidence:** `du` → `du Kategorio:Eo DU{wikt_io}` instead of `du` → `du`  
**Details:** `projects/docs/archive/MERGED_PRS_VERIFICATION.md`

---

### ~~3. ⚠️ Configure GitHub Secrets~~ ✅ COMPLETE
**Location:** `projects/translator/`  
**Status:** ✅ **IMPLEMENTED** - Deployments working since Oct 22-23  
**Evidence:** Multiple successful deployments in GitHub Actions

- ✅ Added `CLOUDFLARE_API_TOKEN` to GitHub Secrets
- ✅ Added `CLOUDFLARE_ACCOUNT_ID` to GitHub Secrets
- ✅ Deployment workflow working successfully

**Why:** Blocks all automated Cloudflare Worker deployments  
**Details:** `projects/translator/DEPLOYMENT_FIX_NEEDED.md`

---

### 4. 🔢 Test Number Recognition in Production
**Location:** `projects/extractor/` → `projects/translator/`  
**Time:** 15-30 minutes  
**Priority:** HIGH  
**Depends on:** Items #1 and #2 above

- [ ] Deploy updated dictionaries with fixed morphology to translator
- [ ] Test word-based numbers ("un", "du", "tri")
- [ ] Test digit-based numbers ("1", "2", "3", "100")
- [ ] Test decimal numbers ("12.34", "2.5")
- [ ] Verify both translation directions (Ido↔Esperanto)

**Why:** Number recognition fix is code complete but needs end-to-end testing  
**Note:** Must fix morphological integration first for complete testing

---

### 5. ✅ Verify Merged PRs Work in Production
**Location:** `apertium/apertium-ido-epo/`  
**Status:** ⚠️ **PARTIALLY COMPLETE**  
**Priority:** MEDIUM

- ⚠️ Test apertium-ido pkg-config srcdir variable (LOCAL ✅, SYSTEM ❌ needs `make install`)
- ✅ Test apertium-ido-epo builds without vendor submodules (VERIFIED)
- ✅ Run integration tests on translator (WORKING - deployments successful)

**Why:** Multiple major PRs were merged, need production verification  
**PRs:** apertium-ido #10, apertium-ido-epo #48, #26, #29  
**Details:** See `projects/docs/archive/MERGED_PRS_VERIFICATION.md`  
**Action Needed:** Run `make install` in apertium-ido to update system pkg-config

---

## 📊 High Priority (This Month)

### 6. 📋 Document Complete Project Flow
**Location:** Project-wide documentation  
**Time:** 2-3 hours  
**Priority:** HIGH  
**Impact:** Team understanding and maintenance

- [ ] Create comprehensive flow diagram (Wikipedia/Wiktionary → Extractor → Apertium → Translator)
- [ ] Document Docker usage (APy server containerization)
- [ ] Document repository separation rationale (apertium/ vs projects/)
- [ ] Update architecture documentation with current state
- [ ] Document critical issues and their fixes
- [ ] Create troubleshooting guide for common issues

**Why:** Project has complex flow with multiple components, needs clear documentation  
**Files to update:** `README.md`, `ARCHITECTURE.md`, `DEPLOYMENT_FLOW.md`

---

### 7. 🔍 Fix Esperanto Wiktionary Low Coverage
**Location:** `projects/extractor/`  
**Time:** 1-2 hours  
**Priority:** HIGH  
**Impact:** +200-400 entries

- [ ] Implement EN/FR pivot approach
- [ ] Test pivot translation quality
- [ ] Integrate into main pipeline

**Why:** Only 39/565 EO Wiktionary entries have direct IO translations  
**Details:** `projects/extractor/TODO.md` (Critical Issue #1)

---

### 7b. 🔠 Expand Ido Morphological Analyzer (Bidix-Focused)
**Location:** `apertium/apertium-ido/`, `projects/embedding-aligner/`  
**Time:** 3-6 hours (first pass)  
**Priority:** HIGH  
**Impact:** Enables bidix entries to actually be usable in translation

- [ ] Extract all Ido lemmas from `apertium-ido-epo.ido-epo.dix` (bidix) and de-duplicate
- [ ] Cross-check against BERT/JSON sources to confirm forms and part-of-speech
- [ ] Generate corresponding entries in `apertium-ido.ido.dix` with correct POS and minimal paradigms
- [ ] Ensure the JSON→bidix export script (`projects/embedding-aligner/scripts/17_format_for_apertium.py` and follow-up merge scripts) **does not overwrite** or corrupt existing monolingual morphology
- [ ] Add a small regression test: for a sample of bidix lemmas (e.g. `partoprenar`, `diskutar`, `esar`, `vorto`, `bona`), verify:
  - [ ] `lt-proc ido.automorf.bin` recognizes surface forms
  - [ ] `lt-proc -b ido-epo.autobil.bin` returns the expected Esperanto translations

**Why:** Most words in bidix (and JSON) are present but not translated because the Ido morphological analyzer is tiny; expanding it from bidix lemmas is the safest, highest-impact starting point.

---

### 8. 🗺️ Fix Wikipedia Filtering
**Location:** `projects/extractor/`  
**Time:** 2-3 hours  
**Priority:** HIGH  
**Impact:** +1,000-3,000 proper nouns

- [ ] Keep entries with Wikipedia language links
- [ ] Implement category-based filtering
- [ ] Test proper noun classification

**Why:** 0/68,015 Wikipedia titles kept (too aggressive filtering)  
**Details:** `projects/extractor/TODO.md` (Critical Issue #2)

---

### 9. 📝 Document EC2 Extraction Results
**Location:** `projects/extractor/`  
**Time:** 30-60 minutes  
**Priority:** MEDIUM

- [ ] Analyze EO Wiktionary pivot results
- [ ] Document EN Wiktionary findings
- [ ] Create recommendations for next run

**Why:** Multiple EC2 extraction runs completed, results need analysis  
**Related:** `ec2-extraction-results/reports/`

---

### 10. 🧹 Clean Up Documentation After Reorganization
**Location:** Project-wide  
**Time:** 1-2 hours  
**Priority:** MEDIUM

- [ ] Remove outdated documentation files
- [ ] Consolidate duplicate TODO files
- [ ] Update main README with new structure
- [ ] Document new folder organization

**Why:** Recent major reorganization left some orphaned docs  
**Related:** Sterile Apertium core vs projects/ separation

---

## 📈 Medium Priority (Next 3 Months)

### 11. 🐳 Containerize Extractor Pipeline
**Time:** 4-6 hours  
**Impact:** Consistency and deployment reliability

- [ ] Create Dockerfile for extractor pipeline
- [ ] Add docker-compose.yml for local development
- [ ] Update terraform to use containerized approach
- [ ] Test Docker-based extraction on EC2
- [ ] Document Docker workflow in README

**Current:** Extractor runs directly on EC2 with manual dependency installation  
**Target:** Containerized pipeline for consistent execution  
**Benefits:** Reproducible builds, easier dependency management, faster deployment

---

### 12. 🌐 Add More Data Sources to Extractor
**Time:** Varies by source  
**Impact:** +5,000-10,000 entries

- [ ] Integrate English Wiktionary fully (2-5k entries)
- [ ] Add German Wiktionary pivot (500-1k entries)
- [ ] Explore Idolinguo dictionary (1-2k entries)
- [ ] Wikidata language links for proper nouns (5-10k entries)

**Details:** `projects/extractor/TODO.md` (Section: Add More Data Sources)

---

### 13. ⚡ Optimize Extractor Performance
**Time:** 2-4 hours  
**Impact:** 2-3x speedup

- [ ] Implement parallel Wiktionary parsing
- [ ] Improve caching with dependency tracking
- [ ] Profile and optimize hot paths

**Current:** ~60-90 minutes | **Target:** <30 minutes  
**Details:** `projects/extractor/TODO.md` (Section: Optimize Performance)

---

### 14. 🤖 Improve Translator Deployment Pipeline
**Time:** 4-8 hours  
**Impact:** Automated dictionary updates

- [ ] Webhook for Extractor → Translator
- [ ] Dictionary hot-reload capability
- [ ] Version tracking and display
- [ ] Rollback capability

**Details:** `projects/translator/TODO.md` (Section: Deployment Improvement)

---

### 15. 📚 Add More Grammar Tests to Apertium Pair
**Time:** 2-4 hours  
**Impact:** Better translation quality

- [ ] Create comprehensive test suite (1000+ sentences)
- [ ] Fix top grammatical error patterns
- [ ] Improve verb handling rules
- [ ] Document all rules with examples

**Details:** `apertium/apertium-ido-epo/TODO.md` (Section: Add More Tests)

---

## 📊 Project Status Summary

### Recent Achievements (Oct 22-26, 2025):
- ✅ Fixed number recognition in dictionaries (PRs merged: #26, #29)
- ✅ Major dictionary improvements merged (feature/regenerate-fast-oct2025)
- ✅ Reorganized project structure (sterile Apertium core + projects/)
- ✅ Merged 8+ PRs across 4 repositories
- ✅ Fixed Dockerfile for APy server deployment
- ✅ Removed vendor submodules from apertium-ido-epo (VERIFIED)
- ✅ Added srcdir to apertium-ido pkg-config (local file done, needs `make install`)
- ✅ Configured GitHub Secrets for automated deployments (VERIFIED)
- ✅ Multiple successful Cloudflare Worker deployments (Oct 22-23)
- ✅ Comprehensive project flow analysis completed (Oct 26)
- ❌ **CRITICAL ISSUE IDENTIFIED**: Morphological rules not integrated in extractor

### Current Stats:
- **Dictionary Size:** ~8,359 entries (bidix)
- **Repositories:** 7 active repos
- **Test Coverage:** Basic (needs expansion)
- **Deployment:** Semi-automated (needs GitHub Secrets)

### Health Indicators:
- 🟢 Core build system: Working
- 🟢 Deployment pipeline: GitHub Secrets configured
- 🔴 **Dictionary generation: INCOMPLETE** (missing morphological rules)
- 🔴 **Translation quality: DEGRADED** (corrupted bilingual entries)
- 🟡 Test coverage: Needs expansion
- 🟡 Number recognition: Fixed, needs production testing
- 🟡 Data sources: Needs more integration
- 🟢 Repository structure: Well organized
- 🟢 Docker usage: APy server containerized
- 🟡 Documentation: Needs flow diagram updates

---

## 🎯 Success Metrics

### Short Term (1 Month):
- [ ] All critical TODOs completed
- [ ] Automated deployments working
- [ ] Number recognition verified in production
- [ ] 10,000+ dictionary entries

### Medium Term (3 Months):
- [ ] 20,000+ dictionary entries
- [ ] 5+ data sources integrated
- [ ] 90%+ translation accuracy on test suite
- [ ] Comprehensive documentation

### Long Term (6-12 Months):
- [ ] 50,000+ dictionary entries
- [ ] Ready for upstream Apertium integration
- [ ] Full CI/CD pipeline
- [ ] Production-ready translation quality

---

## 📚 Key Documentation

- **Main README:** `README.md`
- **Translator Docs:** `projects/translator/DOCUMENTATION_INDEX.md`
- **Extractor Docs:** `projects/extractor/README.md`
- **Deployment Guide:** `projects/translator/DEPLOYMENT_GUIDE.md`
- **Operations Manual:** `projects/translator/OPERATIONS.md`
- **GitHub Secrets Setup:** `projects/translator/GITHUB_SECRETS_SETUP.md`
- **Cloudflare Setup:** `projects/translator/CLOUDFLARE_API_TOKEN_SETUP.md`

---

**Questions or clarifications?** Open an issue or update the relevant TODO file.

