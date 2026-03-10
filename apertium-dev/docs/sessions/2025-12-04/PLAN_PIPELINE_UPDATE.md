# Unified Source Pipeline - Implementation Plan

## Goal

Redesign the dictionary pipeline so that **all sources** (io_wiktionary, io_wikipedia, en_pivot, bert_embeddings) feed into **all outputs** (monodix, bidix, vortaro).

**Key Insight:** `ido_lexicon` is a byproduct, not a source. It should be generated FROM the sources, not used AS a source.

---

## Current State (Broken)

```
io_wiktionary ─┐
io_wikipedia  ─┼──→ bidix + vortaro  ✅
en_pivot      ─┤
ido_lexicon   ─┘    (circular - bootstrapped from old monodix)

bert_embeddings ──→ NOT INTEGRATED ❌

monodix ──→ uses ido_lexicon (old data) ❌
```

## Target State (Fixed)

```
io_wiktionary  ─┬─ translations ─┐
io_wikipedia   ─┤                ├──→ bidix + vortaro
en_pivot       ─┤                │
bert_embeddings─┴────────────────┘

io_wiktionary  ─┬─ morphology ───┐
word_endings   ─┴─ (inferred) ───┴──→ monodix
```

---

## BERT Embeddings Analysis

**Current format** (`translation_candidates.json`):
```json
{
  "provinco": [
    {"epo": "provinco", "similarity": 0.998},
    {"epo": "distrikto", "similarity": 0.981}
  ]
}
```

**What it provides:**
- ✅ Ido words (5,000)
- ✅ Esperanto translations (10 candidates per word)
- ✅ Similarity scores (0.0-1.0)
- ❌ **No morphology** (no POS, no paradigms)

**Morphology solution:** Infer from Ido word endings (Ido is regular):
- `-o` → noun (paradigm: `o__n`)
- `-a` → adjective (paradigm: `a__adj`)
- `-ar` → verb (paradigm: `ar__vblex`)
- `-e` → adverb (paradigm: `e__adv`)
- `-i` → plural noun

---

## Proposed Changes

### Phase 1: Remove `ido_lexicon` dependency

#### [DELETE] `projects/data/sources/source_ido_lexicon.json`
Remove this circular dependency.

#### [MODIFY] `projects/data/scripts/merge_sources.py`
- Remove `ido_lexicon` from source loading
- Add morphology inference function based on word endings

---

### Phase 2: Add BERT embeddings as source

#### [NEW] `projects/data/scripts/convert_bert_to_unified.py`
Convert BERT translation_candidates.json to unified format:

```python
def convert_bert_to_unified(input_path, output_path, min_similarity=0.85):
    """
    Convert BERT translation candidates to unified JSON format.
    
    - Takes top candidate per word (or top N with similarity > threshold)
    - Infers morphology from Ido word endings
    - Sets confidence based on similarity score
    """
```

**Output format:**
```json
{
  "metadata": {
    "source_name": "bert_embeddings",
    "version": "1.0",
    "generation_date": "2025-12-04T...",
    "statistics": {...}
  },
  "entries": [
    {
      "lemma": "provinco",
      "source": "bert_embeddings",
      "pos": "n",
      "morphology": {"paradigm": "o__n"},
      "translations": [
        {"term": "provinco", "lang": "eo", "confidence": 0.85}
      ]
    }
  ]
}
```

#### [NEW] `projects/data/sources/source_bert_embeddings.json`
Generated output file (will be ~5,000 entries).

#### [MODIFY] `projects/data/scripts/regenerate_all.py`
- Add `source_bert_embeddings.json` to source list
- Update statistics

---

### Phase 3: Morphology inference for all sources

#### [NEW] `projects/data/scripts/infer_morphology.py`
Shared morphology inference for all sources:

```python
def infer_ido_morphology(lemma: str) -> dict:
    """
    Infer POS and paradigm from Ido word endings.
    
    Ido is highly regular:
    - Nouns end in -o (singular), -i (plural)
    - Adjectives end in -a
    - Adverbs end in -e
    - Verbs end in -ar (infinitive), -as (present), -is (past), -os (future)
    """
    
    if lemma.endswith('ar'):
        return {'pos': 'vblex', 'paradigm': 'ar__vblex'}
    elif lemma.endswith('o'):
        return {'pos': 'n', 'paradigm': 'o__n'}
    elif lemma.endswith('a'):
        return {'pos': 'adj', 'paradigm': 'a__adj'}
    elif lemma.endswith('e'):
        return {'pos': 'adv', 'paradigm': 'e__adv'}
    # ... etc
```

#### [MODIFY] All parsers
Update `io_wiktionary`, `io_wikipedia`, `en_pivot` parsers to use shared morphology inference when POS is missing.

---

### Phase 4: Update documentation

#### [MODIFY] Root files
- `README.md` - Update data sources description
- `TODO.md` - Update task status
- `QUICK_START.md` - Update regeneration docs

#### [MODIFY] Projects docs
- `projects/translator/DICTIONARY_REGENERATION.md` - Update sources list
- `projects/embedding-aligner/README.md` - Add integration section
- `projects/data/README.md` - Update pipeline description

#### [MODIFY] Embedded docs
Update any references to `ido_lexicon` as a source.

---

## User Review Required

> [!IMPORTANT]
> **BERT similarity threshold:** What minimum similarity score should we use?
> - 0.95+ = ~2,000 high-confidence pairs (very conservative)
> - 0.85+ = ~4,000 pairs (recommended)
> - 0.70+ = ~5,000 pairs (includes more noise)

> [!WARNING]
> **Breaking change:** Removing `ido_lexicon` means the monodix will be regenerated purely from inference. Initial run may have fewer entries than before until we verify the inference works correctly.

---

## Verification Plan

### Automated Tests

1. **Schema validation:**
   ```bash
   cd /home/mark/apertium-gemini/projects/data
   python3 scripts/validate_schema.py --all
   ```

2. **BERT conversion test:**
   ```bash
   # After creating convert script
   python3 scripts/convert_bert_to_unified.py \
     --input ../embedding-aligner/results/bert_ido_epo_alignment/translation_candidates.json \
     --output sources/source_bert_embeddings.json \
     --min-similarity 0.85
   
   # Validate output
   python3 scripts/validate_schema.py sources/source_bert_embeddings.json
   ```

3. **Full regeneration:**
   ```bash
   python3 scripts/regenerate_all.py
   
   # Check outputs exist
   ls -la generated/
   ```

4. **XML validation:**
   ```bash
   xmllint --noout generated/ido.ido.dix
   xmllint --noout generated/ido-epo.ido-epo.dix
   ```

### Manual Verification

1. **Check entry counts:**
   - Before: ~8,604 monodix, ~13,629 bidix
   - After: Should be similar or higher

2. **Spot-check translations:**
   ```bash
   # Check a few known words
   grep "provinco" generated/ido-epo.ido-epo.dix
   grep "hundo" generated/ido-epo.ido-epo.dix
   ```

3. **Test Apertium compilation:**
   ```bash
   cd /home/mark/apertium-gemini/apertium/apertium-ido
   cp ../../projects/data/generated/ido.ido.dix apertium-ido.ido.dix
   make clean && make
   
   echo "provinco" | apertium -d . ido-morph
   ```

---

## Questions Before Starting

1. **BERT similarity threshold** - 0.85 recommended, acceptable?

2. **Paradigm definitions** - The generated monodix needs paradigm XML definitions. Options:
   - A) Extract from current `apertium-ido.ido.dix` and merge
   - B) Generate paradigm definitions programmatically
   - Which approach?

3. **Vortaro format** - Currently uses "legacy" format. Keep legacy or switch to new unified format in UI?

4. **Other sources to add** - You mentioned "probably some more in future". Any specific sources to plan for now?

---

## Estimated Time

| Phase | Time |
|-------|------|
| Phase 1: Remove ido_lexicon | 30 min |
| Phase 2: Add BERT source | 1-2 hours |
| Phase 3: Morphology inference | 1 hour |
| Phase 4: Documentation | 30 min |
| **Total** | **3-4 hours** |

---

## Summary

This plan:
1. ✅ Removes circular `ido_lexicon` dependency
2. ✅ Adds BERT embeddings as 5th source
3. ✅ Adds morphology inference for all sources
4. ✅ Makes all sources feed into all outputs
5. ✅ Updates all documentation
