#!/usr/bin/env python3
"""
Convert old format source files to unified JSON format.

This script converts existing source files from the old format to the new
unified format with multi-source provenance support.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def convert_old_to_unified(old_data, source_name, confidence=1.0):
    """
    Convert old format to unified format.
    
    Old format:
    {
      "metadata": {...},
      "entries": [
        {
          "lemma": "word",
          "pos": "n",
          "translations": {"eo": ["translation1", "translation2"]},
          "morphology": {"paradigm": "o__n"},
          "source_page": "..."
        }
      ]
    }
    
    New format:
    {
      "metadata": {...},
      "entries": [
        {
          "lemma": "word",
          "source": "source_name",
          "pos": "n",
          "translations": [
            {"term": "translation1", "lang": "eo", "confidence": 1.0, "source": "source_name"}
          ],
          "morphology": {"paradigm": "o__n"},
          "metadata": {"source_page": "..."}
        }
      ]
    }
    """
    # Update metadata
    new_metadata = old_data.get('metadata', {})
    new_metadata['source_name'] = source_name
    new_metadata['version'] = new_metadata.get('version', '3.0')
    new_metadata['generation_date'] = datetime.now().isoformat()
    new_metadata['conversion_note'] = 'Converted from old format to unified format'
    
    # Convert entries
    new_entries = []
    for old_entry in old_data.get('entries', []):
        lemma = old_entry.get('lemma', '')
        if not lemma:
            continue
        
        # Convert translations from dict to array
        old_translations = old_entry.get('translations', {})
        new_translations = []
        
        for lang, terms in old_translations.items():
            if isinstance(terms, list):
                for term in terms:
                    new_translations.append({
                        'term': term,
                        'lang': lang,
                        'confidence': confidence,
                        'source': source_name
                    })
            elif isinstance(terms, str):
                new_translations.append({
                    'term': terms,
                    'lang': lang,
                    'confidence': confidence,
                    'source': source_name
                })
        
        # Build new entry
        new_entry = {
            'lemma': lemma,
            'source': source_name,
            'translations': new_translations
        }
        
        # Add optional fields
        if old_entry.get('pos'):
            new_entry['pos'] = old_entry['pos']
        
        if old_entry.get('morphology'):
            new_entry['morphology'] = old_entry['morphology']
        
        # Move source_page to metadata
        entry_metadata = {}
        if old_entry.get('source_page'):
            entry_metadata['source_page'] = old_entry['source_page']
        if old_entry.get('classification'):
            entry_metadata['classification'] = old_entry['classification']
        if old_entry.get('original_pos'):
            entry_metadata['original_pos'] = old_entry['original_pos']
        
        if entry_metadata:
            new_entry['metadata'] = entry_metadata
        
        new_entries.append(new_entry)
    
    return {
        'metadata': new_metadata,
        'entries': new_entries
    }


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 convert_old_sources_to_unified.py <input_file> <output_file> [confidence]")
        print("Example: python3 convert_old_sources_to_unified.py source_io_wikipedia.json output.json 0.9")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    confidence = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    # Extract source name from filename
    source_name = input_file.stem.replace('source_', '')
    
    print(f"Converting {input_file.name} to unified format...")
    print(f"  Source: {source_name}")
    print(f"  Confidence: {confidence}")
    
    # Load old format
    with open(input_file, 'r', encoding='utf-8') as f:
        old_data = json.load(f)
    
    old_entries = len(old_data.get('entries', []))
    print(f"  Old format entries: {old_entries:,}")
    
    # Convert to unified format
    new_data = convert_old_to_unified(old_data, source_name, confidence)
    
    new_entries = len(new_data.get('entries', []))
    print(f"  New format entries: {new_entries:,}")
    
    # Save unified format
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Converted successfully!")
    print(f"  Output: {output_file}")
    print(f"  Size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == '__main__':
    main()
