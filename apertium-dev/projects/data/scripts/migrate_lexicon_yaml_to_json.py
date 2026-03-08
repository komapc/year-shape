#!/usr/bin/env python3
"""
One-time migration script: Convert ido_lexicon.yaml to unified JSON format.

This script reads the YAML lexicon and converts it to the unified JSON format
with proper structure for monodix generation.
"""

import yaml
import json
from datetime import datetime
from pathlib import Path

# Paths
YAML_PATH = Path("apdata/ido_lexicon.yaml")
JSON_OUTPUT = Path("projects/data/sources/source_ido_lexicon.json")

def migrate_lexicon():
    """Migrate YAML lexicon to unified JSON format."""
    
    print(f"Reading YAML lexicon from {YAML_PATH}...")
    with open(YAML_PATH, 'r', encoding='utf-8') as f:
        yaml_data = yaml.safe_load(f)
    
    # Extract metadata
    meta = yaml_data.get('meta', {})
    paradigms = yaml_data.get('paradigms', {})
    entries = yaml_data.get('entries', [])
    
    print(f"Found {len(entries)} entries in YAML")
    
    # Convert to unified format
    unified_entries = []
    
    for entry in entries:
        lemma = entry.get('lemma', '')
        pos = entry.get('pos', '')
        paradigm_key = entry.get('paradigm', '')
        source = entry.get('source', 'ido_lexicon')
        
        # Map paradigm key to actual paradigm value
        paradigm_value = paradigms.get(paradigm_key, paradigm_key)
        
        unified_entry = {
            "lemma": lemma,
            "source": "ido_lexicon",
            "translations": [],  # Monolingual - no translations
            "pos": pos,
            "morphology": {
                "paradigm": paradigm_value
            },
            "metadata": {
                "original_source": source,
                "paradigm_key": paradigm_key
            }
        }
        
        unified_entries.append(unified_entry)
    
    # Create unified JSON structure
    unified_json = {
        "metadata": {
            "source_name": "ido_lexicon",
            "version": str(meta.get('version', '1')),
            "generation_date": datetime.now().strftime("%Y-%m-%d"),
            "original_format": "yaml",
            "migration_note": "Migrated from apdata/ido_lexicon.yaml",
            "statistics": {
                "total_entries": len(unified_entries),
                "entries_with_translations": 0,  # Monolingual
                "entries_with_morphology": len([e for e in unified_entries if e.get('morphology')])
            }
        },
        "entries": unified_entries
    }
    
    # Write to JSON
    print(f"Writing unified JSON to {JSON_OUTPUT}...")
    JSON_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(unified_json, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Migration complete!")
    print(f"   Total entries: {len(unified_entries)}")
    print(f"   Output: {JSON_OUTPUT}")
    print(f"   Size: {JSON_OUTPUT.stat().st_size / 1024 / 1024:.2f} MB")
    
    # Print sample entry
    if unified_entries:
        print("\nSample entry:")
        print(json.dumps(unified_entries[100], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    migrate_lexicon()
