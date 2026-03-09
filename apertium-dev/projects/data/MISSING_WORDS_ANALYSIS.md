# Missing Words Analysis - Root Cause

## Confirmation: Words Exist in Source JSON

### ✅ Found in Sources

1. **`maxim`** - Found in `source_bert_embeddings.json`
   - Confidence: 0.85
   - Translations: max, plu, flankaj
   - Status: ✅ In merged files, ✅ In generated dictionary

2. **`quin`** - Found in `source_bert_embeddings.json`
   - Confidence: 0.85
   - Translations: sinsekvaj, signifis, afrikaj
   - Status: ✅ In merged files, ✅ In generated dictionary

3. **`kreesis`** - Found in `source_bert_embeddings.json`
   - Confidence: 0.85
   - Translations: kreita, inventis, konstruita
   - Status: ✅ In merged files, ❌ NOT in generated dictionary (filtered by confidence threshold)

### ❌ NOT Found in Sources

1. **`e`** - NOT in any source file
   - This is a basic function word (conjunction "and")
   - **Action needed**: Add to source file (likely `source_io_wiktionary.json` or create function words source)

2. **`Paris`** - NOT in any source file
   - This is a proper noun (city name)
   - **Action needed**: Should be in `source_io_wikipedia.json` (check if it exists with different capitalization)

## Root Cause Analysis

### Issue 1: Confidence Threshold Too High

**Problem**: 
- Default `min_confidence` in `regenerate_all.py` is **0.9**
- BERT embeddings have confidence **0.85**
- Words with confidence 0.85 are filtered out during dictionary generation

**Evidence**:
- `kreesis` exists in merged files but NOT in generated dictionary
- `maxim` and `quin` are in generated dictionary (need to verify why they passed)

**Solution Options**:
1. Lower `min_confidence` to 0.85 or lower
2. Improve BERT translation quality to get higher confidence
3. Use different confidence thresholds for different sources

### Issue 2: Missing from Source Files

**Problem**:
- `e` (conjunction) is not in any source file
- `Paris` (proper noun) is not in any source file

**Why**:
- `e` might be too short/common to be in BERT embeddings
- `Paris` might not appear in the Wikipedia/Wiktionary dumps used
- Function words might need a dedicated source file

**Solution**:
- Add `e` to appropriate source (Wiktionary or function words source)
- Check if `Paris` exists with different case or in Wikipedia source
- Consider creating a function words source file

## Why Words Are Not Imported

### Pipeline Flow:

1. **Source JSON files** → Contains words with translations
2. **merge_sources.py** → Merges all sources, deduplicates
3. **merged_bidix.json** → Contains all merged entries
4. **generate_bidix.py** → Filters by confidence threshold (default: 0.9)
5. **Generated .dix file** → Final dictionary

### Filtering Points:

1. **During merge**: Words are merged successfully
2. **During generation**: Words filtered by confidence threshold
   - If `confidence < min_confidence` → Word is skipped
   - Default `min_confidence = 0.9`
   - BERT embeddings have `confidence = 0.85`
   - Result: BERT words are filtered out

## Recommendations

### Immediate Actions

1. **Lower confidence threshold** for testing:
   ```bash
   python3 regenerate_all.py --min-confidence 0.85
   ```

2. **Add missing words to source files**:
   - `e` → Add to `source_io_wiktionary.json` or create function words source
   - `Paris` → Check Wikipedia source, add if missing

3. **Verify generated dictionary**:
   - Check if `maxim` and `quin` are actually in the dictionary
   - If not, investigate why they passed the filter

### Long-term Solutions

1. **Source-specific confidence thresholds**:
   - Wiktionary: 1.0 (always include)
   - Wikipedia: 0.9 (high confidence)
   - BERT: 0.85 (medium confidence, but include important words)

2. **Function words source**:
   - Create dedicated source for function words (e, od, e, etc.)
   - These are critical and should always be included

3. **Proper noun handling**:
   - Ensure proper nouns from Wikipedia are included
   - Check capitalization handling

## Project Rule Added

**CRITICAL RULE**: NEVER add words manually to dictionary files (.dix).
All dictionary entries MUST be generated from source JSON files.
If a word is missing, add it to the appropriate source file and regenerate.

This rule has been added to:
- `generate_bidix.py`
- `generate_monodix.py`

