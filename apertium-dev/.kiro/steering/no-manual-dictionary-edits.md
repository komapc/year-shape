# No Manual Dictionary Edits

**Policy:** NEVER add or modify entries directly in the Apertium dictionary files (`.dix`).

**Workflow:**
1. All data must come from source JSON files in `projects/data/sources/`.
2. If a word is missing or needs a fix, add it to a dedicated manual fixes source file (e.g., `source_manual_fixes.json`).
3. If a pattern is failing (like suffixes or hyphenation), fix the generation scripts (`generate_monodix.py`, `generate_bidix.py`) or the Apertium transfer rules (`.t1x`).
4. Always use the `regenerate_all.py` pipeline to update the dictionary files.

**Rationale:** This ensures the project remains maintainable, reproducible, and that data can be easily synchronized with external sources like Wiktionary.
