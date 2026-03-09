# Missing Words Root Cause Analysis

## 1. Confirmation: Words Exist in Source JSON ✅

### Found in Sources:

| Word | Source | Confidence | In Merged? | In Generated? | Issue |
|------|--------|------------|------------|--------------|-------|
| `maxim` | `source_bert_embeddings.json` | 0.85 | ✅ Yes | ❌ No | Filtered by confidence threshold |
| `quin` | `source_bert_embeddings.json` | 0.85 | ✅ Yes | ❌ No | Filtered by confidence threshold |
| `kreesis` | `source_bert_embeddings.json` | 0.85 | ✅ Yes | ❌ No | Filtered by confidence threshold |
| `e` | ❌ None | N/A | ❌ No | ❌ No | Missing from source files |
| `Paris` | ❌ None | N/A | ❌ No | ❌ No | Missing from source files |

## 2. Why Words Are Not Imported

### Root Cause: Confidence Threshold Filtering

**The Problem**:
- `regenerate_all.py` uses `min_confidence = 0.9` by default
- BERT embeddings have `confidence = 0.85`
- During `generate_bidix.py`, entries with `confidence < 0.9` are **filtered out**

**Code Location**: `projects/data/scripts/generate_bidix.py:269`
```python
# Skip if below confidence threshold
if confidence < min_confidence:
    entries_skipped_low_confidence += 1
    continue
```

**Evidence**:
- `maxim`, `quin`, `kreesis` all exist in `merged_bidix.json` with confidence 0.85
- None of them appear in `generated/ido-epo.ido-epo.dix`
- They are filtered out during generation, not during merging

### Pipeline Flow:

```
Source JSON (confidence: 0.85)
    ↓
merge_sources.py (no filtering)
    ↓
merged_bidix.json ✅ (words present)
    ↓
generate_bidix.py (filters: confidence < 0.9)
    ↓
Generated .dix ❌ (words missing - filtered out)
```

### Why `e` and `Paris` Are Missing:

1. **`e`** (conjunction "and"):
   - Not in any source file
   - Too short/common for BERT embeddings
   - Should be in Wiktionary or function words source
   - **Action**: Add to `source_io_wiktionary.json` or create function words source

2. **`Paris`** (proper noun):
   - Not in any source file
   - Should be in Wikipedia source (check capitalization)
   - **Action**: Check `source_io_wikipedia.json` for "paris" (lowercase) or add if missing

## 3. Solution

### Immediate Fix:

**Option A: Lower confidence threshold**
```bash
cd projects/data
python3 scripts/regenerate_all.py --min-confidence 0.85
```

**Option B: Add missing words to sources**
- Add `e` to Wiktionary source
- Add `Paris` to Wikipedia source (or check if exists with different case)

### Long-term Solution:

1. **Source-specific confidence thresholds**:
   - Wiktionary: Always include (confidence 1.0)
   - Wikipedia: High threshold (0.9)
   - BERT: Lower threshold (0.85) but include important words

2. **Function words source**:
   - Create dedicated source for critical function words
   - Always include regardless of confidence

3. **Improve BERT translations**:
   - Increase confidence scores for important words
   - Better alignment/translation quality

## 4. Project Rule Added ✅

**CRITICAL RULE**: NEVER add words manually to dictionary files (.dix).
All dictionary entries MUST be generated from source JSON files.
If a word is missing, add it to the appropriate source file and regenerate.

**Added to**:
- `generate_bidix.py` (header comment)
- `generate_monodix.py` (header comment)

## Verification Commands

```bash
# Check if word exists in source
python3 scripts/diagnose_missing_words.py

# Check merged file
grep '"lemma": "maxim"' merged/merged_bidix.json

# Check generated dictionary
grep "<l>maxim</l>" generated/ido-epo.ido-epo.dix

# Regenerate with lower confidence
python3 scripts/regenerate_all.py --min-confidence 0.85
```

