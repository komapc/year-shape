# Session State - December 19, 2025

## Summary

This document captures the current state of the Ido-Esperanto translation system for session continuity.

## Current Translation Quality

**Test sentence output has significant errors:**
- 14 unknown words (`*word`)
- 12 generation errors (`@word`)
- 10 ambiguous translations (`#word`)
- 94 corrupted bidix entries with `↓` marker

**Estimated accuracy: ~40%**

See `TRANSLATION_ERROR_ANALYSIS.md` for detailed breakdown.

## Recent PRs (All Merged)

### Merged (Dec 18, 2025)
- **Extractor #54**: fix: improve function word handling
- **apertium-ido-epo #72**: feat: update dictionary
- **apertium-ido #20**: feat: update monodix
- **embedding-aligner #17**: feat: regeneration pipeline

### Pending Review
- **Extractor PR #56**: [fix: use 'pr' POS tag to match monodix](https://github.com/komapc/ido-esperanto-extractor/pull/56)
  - Bidix was using `<prep>` but monodix uses `<pr>` - mismatch caused lookup failure

## Critical Issues

### 1. Corrupted Bidix Entries (CRITICAL)
**94 entries contain `↓` marker from Wiktionary annotations**

Examples:
```xml
<r>de ↓ (indikante aganton)</r>  <!-- Should be: de -->
<r>en ↓</r>                       <!-- Should be: en -->
```

**Fix:** Update `generate_bidix.py` to strip metadata markers.

### 2. Missing Words (HIGH)
| Ido | Expected EO | Status |
|-----|-------------|--------|
| derivante | derivanta | Missing participle paradigm |
| kreesis | kreiĝis | Missing passive verb paradigm |
| nomizas | nomas | Not in dictionary |
| maxim | plej | Entry exists but wrong format |
| quin | kiujn | Not in dictionary |

### 3. Disambiguation Issues (HIGH)
| Ido | Expected | Actual | Issue |
|-----|----------|--------|-------|
| da | de (prep) | @d | Adjective `d` wins over preposition `da` |
| la | la (det) | @l | Adjective `l` wins over determiner `la` |
| ol | ĝi (prn) | @Ol | Pronoun not generated correctly |
| on | oni (prn) | @on | Pronoun not generated correctly |

**Fix:** Add CG rules to prefer determiners/prepositions over adjectives.

### 4. Accusative `-n` Errors (MEDIUM)
- `linguo` → `lingvon` (incorrect accusative)
- Transfer rules adding accusative incorrectly

## Files Modified (This Session)

### Created
- `/home/mark/apertium-gemini/TRANSLATION_ERROR_ANALYSIS.md` - Comprehensive error analysis

### Deleted (Obsolete)
- 45+ obsolete corpus files (ERROR_ANALYSIS_*.md, translation_*.txt, etc.)
- Redundant PR and fix summary files
- Outdated session documents

## Build Commands

```bash
# Regenerate bidix
cd /home/mark/apertium-gemini/projects/extractor
python3 scripts/generate_bidix.py \
  --input data/merged_bidix.json \
  --output apertium-ido-epo.ido-epo.dix

# Rebuild apertium-ido-epo
cd /home/mark/apertium-gemini/apertium/apertium-ido-epo
cp /home/mark/apertium-gemini/projects/extractor/apertium-ido-epo.ido-epo.dix .
make clean && make -j4

# Test translation
echo "Ido esas konstruktita linguo" | apertium -d . ido-epo
```

## Next Steps (Priority Order)

1. **Fix corrupted bidix entries** (30 min) - Strip `↓` and parenthetical hints
2. **Merge PR #56** - Enables preposition translation
3. **Add CG disambiguation rules** - For `da`, `la`, `ol`, `on`
4. **Add missing verbs** - `kreesar`, `nomizar` to lexicon
5. **Add participle paradigms** - Handle `-ant-` suffix

## Statistics

| Metric | Value |
|--------|-------|
| Bidix entries | ~28,034 |
| Monodix entries | ~13,002 |
| Corrupted entries | 94 |
| Unknown words in test | 14 |
| Generation errors | 12 |
