# Changelog

## [Unreleased]

### Added
- Added `np__np` paradigm to `pardefs.xml` for proper nouns
- Automatic `np__np` paradigm assignment in `merge_sources.py` for all entries with `pos: "np"`
- Proper noun support in `source_io_wikipedia.json` (already had `pos: "np"`, now gets paradigm automatically)
- Overrides in `merge_sources.py` for Ido pronouns `il`, `el`, `ol`, `on` and question particle `ka` (not in io.wiktionary but linguistically required)
- `EPO_PRONOUN_FORMS` mapping in `generate_bidix.py` for correct Esperanto morphological forms of Ido pronouns

### Changed
- Removed `source_manual.json` - all dictionaries now regenerated from sources only
- Removed `source_function_words_seed.json` - function words now extracted from io.wiktionary
- Removed `source_ido_grammar.json` - grammar items moved to script-level overrides in `merge_sources.py`
- `SOURCE_PRIORITY` in `merge_sources.py` no longer references deleted seed sources
- `merge_sources.py` now protects function-word POS tags from being overwritten by morphological inference
- `generate_bidix.py` comma-splits translation terms (e.g., `de, da` → `de`) to prevent broken bidix entries
- `generate_bidix.py` strips embedded XML tags from determiner translations before generating bidix entry
- `merge_sources.py` now automatically assigns `np__np` paradigm to proper nouns from any source

### Fixed
- `la` (Ido article): monodix paradigm changed from `a__adj` (stem `l`, wrong) to `__det` (stem `la`, correct) — now translates correctly to Esperanto `la`
- `e` (Ido conjunction "and"): monodix paradigm changed from `a__adj` to `__cnjcoo` — now translates to `kaj`
- `ka` (Ido question particle): monodix paradigm changed from `a__adj` to `__cnjsub` — now translates to `ĉu`
- `irar` (Ido "to go"): monodix stem corrected from `i` to `ir` — past tense `iris` now recognized
- Wiktionary parser (3 bugs): category links now stripped before link text; navigation arrows (`↓↑`) stripped; multi-section wiktionary pages (e.g., `por`, `de`) now parse all sections not just the first
- Esperanto monodix: fixed `si__prn___mergeTODO` undefined paradigm → replaced with existing `si__prn`, enabling recompilation of `epo.autogen.bin` which now includes missing verbs (`veni`, etc.) and prepositions (`por`)
- Pronoun translations: `il→li`, `el→ŝi`, `ol→ĝi`, `on→oni`, `me→mi`, `tu→vi`, `ni→ni` now work in ido→epo
- Case sensitivity issue for proper nouns in translation pipeline
- Missing paradigm definition for proper nouns (`np__np`)

### Known Limitations
- epo→ido direction: personal pronouns (`li`, `ŝi`, etc.) do not reverse-translate due to `<subj>` tag mismatch between Esperanto monodix analysis and bidix entries
- epo→ido direction: `veni` tagged as `vbser` in Esperanto analysis but bidix has `vblex`, causing verb lookup failures
- `aktivisto` (Ido activist): not in io.wiktionary; BERT gives wrong translation (`artisto`)

