# Translation Error Analysis - December 19, 2025

## Test Sentence

**Ido Input:**
```
Ido esas konstruktita linguo derivante de Reformita Esperanto (reformita linguo konstruktita de Esperanto, facita da la originala kreinto di Esperanto) adoptita kom Esperanto reformita en Paris da la Delegitaro (Délégation pour l'adoption d'une langue auxiliaire internationale) ye la 24ma di oktobro 1907. Ido kreesis por havar poka polisemio, esas sat konciza, facile lernebla e uzebla. Ol kreesis por esar Internaciona auxiliara linguo por personi de diversa origini e esas la maxim sucesoza de la multa Esperanto-derivaji, quin on nomizas Esperantidoj.
```

**Current Output (with errors):**
```
@Id estas #konstruiita linguo *derivante de Reformita Esperanton (reformita lingvon konstruas de Esperanto, faras @d @l #originalo #kreiint de Esperanto) adoptas kiel Esperanto reformas #en ↓ #Vetis @d @l #Delegitaro, delegacio (*Délégation *pour @l'*adoption @d'*une *langue *auxiliaire *internationale) je @l @24ma di oktobr *1907. @Id *kreesis por havi malmultan #poluriemi, estas #sate konciza, facile #lerni kaj #uzi. @Ol *kreesis por esti #Internaciaa auxiliara linguo por personoj de diversaj originoj kaj estas @l *maxim #sukcecooz de @l multa Esperanto-derivaĵoj, *quin @on *nomizas *Esperantidoj@.
```

**Expected Output (corrected):**
```
Ido estas konstruita lingvo derivanta de Reformita Esperanto (reformita lingvo konstruita de Esperanto, farita de la originala kreinto de Esperanto) adoptita kiel Esperanto reformita en Parizo de la Delegitaro (Délégation pour l'adoption d'une langue auxiliaire internationale) je la 24-a de oktobro 1907. Ido kreiĝis por havi malmultan polisemion, estas sufiĉe konciza, facile lernebla kaj uzebla. Ĝi kreiĝis por esti internacia helplingvo por personoj de diversaj originoj kaj estas la plej sukcesa de la multaj Esperanto-derivaĵoj, kiujn oni nomas Esperantidoj.
```

---

## Error Summary

| Symbol | Meaning | Count | Impact |
|--------|---------|-------|--------|
| `*word` | Unknown word (not in dictionary) | 14 | HIGH |
| `@word` | Generation error (morphology issue) | 12 | HIGH |
| `#word` | Ambiguous translation | 10 | MEDIUM |
| `↓` | Corrupted dictionary entry | 1 visible | HIGH |

---

## Detailed Error Analysis

### Category 1: Unknown Words (`*word`) - HIGH PRIORITY

| Ido Word | Expected EO | Issue | Fix |
|----------|-------------|-------|-----|
| `derivante` | derivanta | Verb participle not in dictionary | Add `-ant-` suffix paradigm |
| `kreesis` | kreiĝis | Passive verb not recognized | Add `-es-` passive paradigm |
| `nomizas` | nomas | Verb not in dictionary | Add `nomizar` verb |
| `Délégation` | - | French word (expected) | Keep as-is |
| `pour` | - | French word (expected) | Keep as-is |
| `l'adoption` | - | French word (expected) | Keep as-is |
| `d'une` | - | French word (expected) | Keep as-is |
| `langue` | - | French word (expected) | Keep as-is |
| `auxiliaire` | - | French word (expected) | Keep as-is |
| `internationale` | - | French word (expected) | Keep as-is |
| `1907` | 1907 | Number not handled | Add number paradigm |
| `maxim` | plej | Adverb not translated | Fix bidix entry (exists but wrong format) |
| `quin` | kiujn | Relative pronoun | Add to dictionaries |
| `Esperantidoj` | Esperantidoj | Neologism | Add to dictionaries |

### Category 2: Generation Errors (`@word`) - HIGH PRIORITY

| Ido Word | Output | Expected | Issue |
|----------|--------|----------|-------|
| `Ido` | @Id | Ido | Proper noun not recognized |
| `da` | @d | de | Ambiguous: adjective `d` wins over prep `da` |
| `la` | @l | la | Ambiguous: adjective `l` wins over det `la` |
| `ol` | @Ol | ĝi | Pronoun exists but wrong generation |
| `on` | @on | oni | Pronoun exists but wrong generation |
| `24ma` | @24ma | 24-a | Ordinal number not handled |

### Category 3: Wrong Translation (`#word`) - MEDIUM PRIORITY

| Ido Word | Output | Expected | Issue |
|----------|--------|----------|-------|
| `konstruktita` | #konstruiita | konstruita | Double `i` in output |
| `en` | #en ↓ | en | Corrupted bidix entry with `↓` |
| `originalo` | #originalo | originala (adj) | Wrong POS |
| `kreiint` | #kreiint | kreinto | Wrong morphology |
| `polisemio` | #poluriemi | polisemio | Wrong translation |
| `sate` | #sate | sufiĉe | Wrong translation |
| `lernebla` | #lerni | lernebla | -ebl adjective not generated |
| `uzebla` | #uzi | uzebla | -ebl adjective not generated |
| `Internaciaa` | #Internaciaa | internacia | Double `a` in output |
| `sukcecooz` | #sukcecooz | sukcesa | Wrong translation |

### Category 4: Data Corruption - CRITICAL

**94 bidix entries contain corrupted data with `↓` marker:**

Examples:
```xml
<r>de ↓ (indikante aganton)<s n="pr" /></r>  <!-- Should be: de -->
<r>en ↓<s n="pr" /></r>                       <!-- Should be: en -->
<r>dika ↓</r>                                 <!-- Should be: dika -->
```

**Root Cause:** Wiktionary annotations not stripped during extraction.

---

## Fixes Required

### Fix 1: Clean Corrupted Bidix Entries (CRITICAL)
**Location:** `projects/extractor/scripts/` or `projects/data/scripts/`  
**Time:** 30 minutes

Strip all metadata markers (`↓`, `→`, `←`, text in parentheses) from bidix translations.

```python
# In generate_bidix.py or merge_sources.py
import re
def clean_translation(text):
    # Remove arrow markers
    text = re.sub(r'\s*[↓→←]\s*', '', text)
    # Remove parenthetical hints
    text = re.sub(r'\s*\([^)]+\)\s*', '', text)
    return text.strip()
```

### Fix 2: Add Missing Words (HIGH)
**Location:** `apdata/ido_lexicon.yaml` + regenerate  
**Time:** 1 hour

Add these entries:
```yaml
# Verbs with passive forms
- lemma: kreesar
  pos: vblex
  paradigm: ar_es__vblex  # passive paradigm
  translations:
    - {lang: eo, term: kreiĝi}

- lemma: nomizar
  pos: vblex
  paradigm: ar__vblex
  translations:
    - {lang: eo, term: nomi}

# Relative pronouns
- lemma: quin
  pos: rel
  paradigm: quin__rel
  translations:
    - {lang: eo, term: kiun}

# Adverbs
- lemma: maxim
  pos: adv
  paradigm: __adv
  translations:
    - {lang: eo, term: plej}
```

### Fix 3: Fix Disambiguation (HIGH)
**Location:** `apertium-ido-epo/apertium-ido-epo.ido.rlx`  
**Time:** 1 hour

Add constraint grammar rules:
```
# Prefer determiner "la" over adjective "l"
SELECT (det) IF (0 ("la"));

# Prefer preposition "da" over adjective "d"
SELECT (pr) IF (0 ("da"));

# Prefer pronoun "ol" over preposition
SELECT (prn) IF (0 ("ol") OR ("on"));
```

### Fix 4: Add Participle Paradigms (HIGH)
**Location:** `apertium-ido/apertium-ido.ido.dix`  
**Time:** 1 hour

Add `-ant-` (present active participle) paradigm to handle `derivante`, etc.

### Fix 5: Fix -ebl Adjective Generation (MEDIUM)
**Issue:** `lernebla` → `#lerni` instead of `lernebla`  
**Location:** Transfer rules or morphology

---

## Priority Order

1. **CRITICAL:** Clean 94 corrupted bidix entries (30 min)
2. **HIGH:** Add missing function word entries (30 min)
3. **HIGH:** Fix disambiguation rules for da/la/ol/on (1 hr)
4. **HIGH:** Add kreesar, nomizar, maxim to lexicon (30 min)
5. **MEDIUM:** Add participle paradigms (1 hr)
6. **MEDIUM:** Fix -ebl adjective handling (1 hr)

---

## Expected Improvement

After fixes, estimated translation quality:
- Unknown words: 14 → 6 (French words expected)
- Generation errors: 12 → 2
- Wrong translations: 10 → 3

**Expected accuracy improvement: ~40% → ~80%**

