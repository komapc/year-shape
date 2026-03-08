## [Unreleased] - December 19, 2025

### Fixed
- Fixed function word disambiguation: `la`, `da`, `di`, `ol`, `on` now have correct POS tags
  - `la` → determiner (was incorrectly adjective due to `-a` suffix inference)
  - `da`, `di` → preposition (was incorrectly adjective)
  - `ol`, `on` → pronoun (was incorrectly preposition)
- Added "artiklo" → "determiner" mapping to Wiktionary parser for Ido articles
- **Fixed Wiktionary parser at source level** - Added `clean_wiktionary_term()` to `utils/parser_base.py`
  - Strips arrow markers: `↓`, `→`, `←`, `↑`
  - Strips parenthetical hints: `(indikante aganton)`, etc.
  - Re-ran Ido Wiktionary parser to regenerate clean `source_io_wiktionary.json`
- Regenerated `merged_bidix.json` from clean sources (13,213 entries)
- Regenerated `apertium-ido-epo.ido-epo.dix` with 13,918 clean entries
- Also added `clean_translation()` to `generate_bidix.py` as safety net

### Added
- `source_function_words_seed.json` - Manually curated function words with highest priority (5)
- FUNCTION_WORDS exclusion list in BERT converter to prevent wrong POS inference

### Changed
- Updated `merge_sources.py` to give function_words_seed highest priority (5)
- Deleted obsolete duplicate `projects/extractor/sources/` directory
- Deleted 45+ obsolete documentation files from corpus directory
- Updated `SESSION_STATE.md` with current translation status
- Created comprehensive `TRANSLATION_ERROR_ANALYSIS.md`
- Updated `projects/data/README.md` to clarify canonical source locations

---

## Previous Fixes

### Fixed
- Fixed critical tense translation errors (past tense `partoprenis` → `partoprenas`) by aligning paradigm tags and filtering conjugated forms.
- Fixed data corruption in dictionary entries by stripping metadata markers (arrows `↓` and parenthetical hints).
- Implemented filtering in `merge_sources.py` to prevent conjugated verb forms from polluting dictionary as lemmas.
- Updated `generate_bidix.py` to prefer infinitive translations for verbs, further preventing tense mismatches.
- Updated `pardefs.xml` to use standard Apertium tags (`pri`, `pii`, `fti`, `cni`) instead of non-standard ones.

