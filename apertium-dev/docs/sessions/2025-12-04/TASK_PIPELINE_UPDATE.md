# Task: Unified Source Pipeline Implementation

## Phase 1: Remove ido_lexicon dependency
- [x] Delete `source_ido_lexicon.json` (moved to sources_old)
- [x] Update `merge_sources.py` to not expect ido_lexicon
- [x] Remove references in other scripts

## Phase 2: Add BERT embeddings source
- [x] Create `convert_bert_to_unified.py` script
- [x] Generate `source_bert_embeddings.json` (4,942 entries)
- [x] Validate with schema
- [x] Copy to data/sources and add to merge pipeline

## Phase 3: Add morphology inference
- [x] Create `infer_ido_morphology()` with Ido word ending rules
- [x] Integrate into merge pipeline (10,524 entries inferred)
- [x] Test morphology assignment

## Phase 4: Paradigm handling
- [ ] Extract paradigms from current `apertium-ido.ido.dix`
- [ ] Create merge script for paradigms
- [ ] Update monodix generator

## Phase 5: Vortaro new format
- [ ] Update vortaro export to use new format
- [ ] Delete legacy format code
- [ ] Update vortaro UI if needed

## Phase 6: Documentation updates
- [ ] Update `README.md` (root)
- [ ] Update `projects/data/README.md`
- [ ] Update `projects/translator/DICTIONARY_REGENERATION.md`
- [ ] Update `projects/embedding-aligner/README.md`
- [ ] Clean up obsolete docs

## Phase 7: Verification
- [ ] Run full regeneration
- [ ] Validate XML outputs
- [ ] Test Apertium compilation
- [ ] Check entry counts
