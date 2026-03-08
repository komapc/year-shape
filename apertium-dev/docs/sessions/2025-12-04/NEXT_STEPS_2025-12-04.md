# Next Steps - December 4, 2025

**After:** DIX Generation Implementation Complete  
**Focus:** POS Coverage, PRs, and Testing

---

## 🎯 Immediate Actions (Next Session)

### 1. Push Extractor PR (5 minutes)

✅ **Branch created:** `feat/unified-json-format-output`  
✅ **Commit ready:** `20fe5e0`

```bash
cd /home/mark/apertium-gemini/projects/extractor
git push origin feat/unified-json-format-output
```

Then create PR on GitHub with description from `PR_SUMMARY_2025-12-04.md`.

---

### 2. Improve POS Tag Coverage (2-4 hours)

**Current:** 40% (5,031 / 12,650 entries)  
**Target:** 80-90%

**Approach:**

#### A. Enhance io_wiktionary Parser

Add POS extraction from Wiktionary templates:

```python
# In scripts/utils/parser_base.py or io_wiktionary parser

def extract_pos_from_wiktionary(wikitext: str) -> Optional[str]:
    """Extract POS from Wiktionary template."""
    # Look for {{substantivo}}, {{verbo}}, {{adjektivo}}, etc.
    pos_patterns = {
        r'\{\{substantivo': 'n',
        r'\{\{verbo': 'v',
        r'\{\{adjektivo': 'adj',
        r'\{\{adverbo': 'adv',
        r'\{\{prepoziciono': 'pr',
        r'\{\{pronomo': 'prn',
    }
    
    for pattern, pos in pos_patterns.items():
        if re.search(pattern, wikitext, re.IGNORECASE):
            return pos
    
    return None
```

#### B. Infer POS for en_pivot

Already partially done with `guess_pos_ido()` and `guess_pos_esperanto()`.

Enhance to be more reliable:
- Add list of known prepositions, conjunctions, etc.
- Use English POS from pivot data if available

#### C. Extract from ido_lexicon Paradigms

```python
# In migration script or merge step

paradigm_to_pos = {
    'o__n': 'n',
    'ar__vblex': 'v',
    'a__adj': 'adj',
    'e__adv': 'adv',
    '__pr': 'pr',
    '__prn': 'prn',
    '__det': 'det',
}

if 'paradigm' in entry['morphology']:
    paradigm = entry['morphology']['paradigm']
    for pattern, pos in paradigm_to_pos.items():
        if paradigm.startswith(pattern.split('__')[0]):
            entry['pos'] = pos
            break
```

#### D. Re-run Pipeline

```bash
# After making changes
cd /home/mark/apertium-gemini/projects/extractor
make regenerate-fast

cd ../data
python3 scripts/regenerate_all.py

# Check results
grep -c '"pos"' merged/merged_bidix.json
```

**Expected result:** 10,000+ entries with POS (vs 5,031 now)

---

### 3. Create Vortaro PR (2-3 hours)

**Changes needed:**

#### A. Update Data Loading

```javascript
// In vortaro main.js or data loader

async function loadDictionary() {
  const response = await fetch('vortaro_dictionary.json');
  const data = await response.json();
  
  // New format has:
  // - data.entries (array)
  // - entry.source_details.all_sources (array)
  // - translation.sources (array)
  
  return data.entries;
}
```

#### B. Enhance UI Display

```html
<!-- Show sources for each entry -->
<div class="entry">
  <div class="lemma">kavalo</div>
  <div class="translations">
    <span class="translation">ĉevalo</span>
    <span class="confidence">★★★★★</span>
    <div class="sources">
      <small>Sources: io_wiktionary, en_pivot</small>
    </div>
  </div>
</div>
```

#### C. Add Confidence Indicators

```javascript
function getConfidenceStars(confidence) {
  if (confidence >= 0.95) return '★★★★★';
  if (confidence >= 0.85) return '★★★★';
  if (confidence >= 0.75) return '★★★';
  if (confidence >= 0.65) return '★★';
  return '★';
}
```

#### D. Steps

```bash
cd /home/mark/apertium-gemini/projects/vortaro
git checkout -b feat/multi-source-provenance

# Copy new data
cp ../data/generated/vortaro_dictionary.json .

# Make code changes (data loading, UI)
# ... edit files ...

git add .
git commit -m "feat: Display multi-source provenance and confidence scores"
git push origin feat/multi-source-provenance
# Create PR
```

---

### 4. Create Translator PR (1-2 hours)

**Changes needed:**

#### A. Document Regeneration Process

Create `DICTIONARY_REGENERATION.md`:

```markdown
# Dictionary Regeneration Process

## Overview

Dictionaries are now generated from unified JSON sources using an automated pipeline.

## Quick Regeneration

```bash
cd /home/mark/apertium-gemini/projects/data
python3 scripts/regenerate_all.py
```

## Output

- `generated/ido.ido.dix` - Monodix (8,604 entries)
- `generated/ido-epo.ido-epo.dix` - Bidix (13,629 entries)
- `generated/vortaro_dictionary.json` - Vortaro export

## Deployment

1. Copy to apertium directories
2. Merge paradigm definitions (monodix only)
3. Recompile with `make`
4. Test translations
5. Deploy to production

See `projects/data/README.md` for format details.
```

#### B. Commit Current Changes

```bash
cd /home/mark/apertium-gemini/projects/translator
git checkout -b docs/dictionary-regeneration

# Check what needs to be committed
git status

# Commit _worker.js changes and submodule update
git add _worker.js ido-epo-translator
git commit -m "docs: Add dictionary regeneration workflow

- Document unified JSON format pipeline
- Add regeneration instructions
- Update deployment process"

git push origin docs/dictionary-regeneration
# Create PR
```

---

### 5. Test Generated Dictionaries (CRITICAL)

**Prerequisite:** Merge paradigm definitions

#### A. Merge Paradigms into Monodix

```bash
cd /home/mark/apertium-gemini/apertium/apertium-ido

# Extract paradigm definitions from current monodix
xmllint --xpath '//pardefs' apertium-ido.ido.dix > paradigms.xml

# Manually merge into projects/data/generated/ido.ido.dix
# Replace the <!-- comment --> with actual paradigms
```

Or use a script:

```python
import xml.etree.ElementTree as ET

# Load current monodix (has paradigms)
current = ET.parse('apertium/apertium-ido/apertium-ido.ido.dix')
pardefs_current = current.find('.//pardefs')

# Load generated monodix (has new entries)
generated = ET.parse('projects/data/generated/ido.ido.dix')
pardefs_generated = generated.find('.//pardefs')

# Replace generated pardefs with current ones
generated.getroot().remove(pardefs_generated)
generated.getroot().insert(2, pardefs_current)  # After sdefs

# Save
generated.write('projects/data/generated/ido.ido.dix', encoding='utf-8', xml_declaration=True)
```

#### B. Deploy and Test

```bash
# Backup current files
cd /home/mark/apertium-gemini/apertium
cp apertium-ido/apertium-ido.ido.dix apertium-ido/apertium-ido.ido.dix.backup
cp apertium-ido-epo/apertium-ido-epo.ido-epo.dix apertium-ido-epo/apertium-ido-epo.ido-epo.dix.backup

# Copy generated files
cp ../projects/data/generated/ido.ido.dix apertium-ido/
cp ../projects/data/generated/ido-epo.ido-epo.dix apertium-ido-epo/

# Recompile
cd apertium-ido
make clean && make

cd ../apertium-ido-epo
make clean && make

# Test basic translations
echo "personi" | apertium -d . ido-epo
echo "la hundo" | apertium -d . ido-epo
echo "me amas tu" | apertium -d . ido-epo

# Test 100 random sentences
# ... create test suite ...
```

---

## 📊 Expected Outcomes

### After POS Improvement
- **POS coverage:** 80-90% (up from 40%)
- **Better translation accuracy** for complex sentences
- **Fewer ambiguous translations**

### After PRs Merged
- **Extractor:** Unified format in main branch
- **Vortaro:** Multi-source transparency
- **Translator:** Documented regeneration process

### After Testing
- **Validated dictionaries** work with Apertium
- **60% more vocabulary** coverage confirmed
- **Translation quality** measured and documented

---

## 📋 Updated TODO Items

Added to `TODO.md`:

1. ✅ **Unified JSON Format & DIX Generation** - COMPLETE
2. 🆕 **Improve POS Tag Coverage** - 40% → 80-90%
3. 🆕 **Create PRs** - Extractor (ready), Vortaro (needed), Translator (needed)
4. 🆕 **Test Generated Dictionaries** - Merge paradigms, deploy, test

---

## 🔗 Related Documentation

- `TODO.md` - Updated with new tasks
- `PR_SUMMARY_2025-12-04.md` - PR details and commands
- `SESSION_2025-12-04_DIX_GENERATION.md` - Complete session summary
- `CURRENT_STATUS_2025-12-04.md` - Current project status
- `projects/data/BIDIX_POS_INVESTIGATION.md` - POS tag findings

---

## 💡 Quick Commands Reference

### Push Extractor PR
```bash
cd /home/mark/apertium-gemini/projects/extractor
git push origin feat/unified-json-format-output
```

### Regenerate Dictionaries
```bash
cd /home/mark/apertium-gemini/projects/data
python3 scripts/regenerate_all.py --skip-validation --skip-merge
```

### Check POS Coverage
```bash
cd /home/mark/apertium-gemini/projects/data
python3 -c "import json; data=json.load(open('merged/merged_bidix.json')); with_pos=[e for e in data['entries'] if 'pos' in e and e['pos']]; print(f'{len(with_pos)}/{len(data[\"entries\"])} = {len(with_pos)*100/len(data[\"entries\"]):.1f}%')"
```

### Test Translation
```bash
cd /home/mark/apertium-gemini/apertium/apertium-ido-epo
echo "personi" | apertium -d . ido-epo
```

---

**Ready for next session!** 🚀

