#!/usr/bin/env python3
"""
Export merged bidix to LEGACY vortaro format (for backward compatibility).

The current vortaro UI expects the old format:
{
  "word1": {
    "esperanto_words": ["translation1", "translation2"],
    "morfologio": ["n", "adj"],
    "sources": ["io_wiktionary"]
  }
}

Input: merged_bidix.json
Output: dictionary.json (legacy format)
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List


def convert_to_legacy_format(bidix_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert unified format to legacy vortaro format."""
    
    entries = bidix_data.get('entries', [])
    metadata = bidix_data.get('metadata', {})
    stats = metadata.get('statistics', {})
    
    # Legacy format: dictionary with words as keys
    legacy_dict = {}
    
    # Add metadata at top level
    legacy_dict['metadata'] = {
        'version': '1.0',
        'generation_date': datetime.now().isoformat(),
        'total_unique_ido_words': len(entries),
        'sources': list(stats.get('sources', {}).keys()) if stats.get('sources') else [],
        'format': 'legacy',
        'note': 'Converted from unified format for backward compatibility'
    }
    
    for entry in entries:
        lemma = entry.get('lemma', '').strip()
        if not lemma:
            continue
        
        translations = entry.get('translations', [])
        if not translations:
            continue
        
        # Extract Esperanto words
        esperanto_words = []
        for trans in translations:
            if trans.get('lang') == 'eo':
                term = trans.get('term', '').strip()
                if term and term not in esperanto_words:
                    esperanto_words.append(term)
        
        if not esperanto_words:
            continue
        
        # Get POS
        pos = entry.get('pos')
        morfologio = [pos] if pos else []
        
        # Collect all sources
        all_sources = set()
        source = entry.get('source')
        if source:
            all_sources.add(source)
        
        entry_metadata = entry.get('metadata', {})
        merged_from = entry_metadata.get('merged_from_sources', [])
        all_sources.update(merged_from)
        
        for trans in translations:
            trans_sources = trans.get('sources', [])
            all_sources.update(trans_sources)
        
        # Create legacy entry
        legacy_dict[lemma] = {
            'esperanto_words': esperanto_words,
            'morfologio': morfologio,
            'sources': sorted(list(all_sources))
        }
    
    return legacy_dict


def main():
    parser = argparse.ArgumentParser(
        description='Export merged bidix to LEGACY vortaro format'
    )
    parser.add_argument(
        '--input',
        type=Path,
        default=Path(__file__).parent.parent / 'merged' / 'merged_bidix.json',
        help='Input merged_bidix.json file'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path(__file__).parent.parent / 'generated' / 'dictionary_legacy.json',
        help='Output dictionary.json file (legacy format)'
    )
    
    args = parser.parse_args()
    
    print(f"Loading merged bidix from {args.input}...")
    with open(args.input, 'r', encoding='utf-8') as f:
        bidix_data = json.load(f)
    
    print(f"Converting to legacy vortaro format...")
    legacy_data = convert_to_legacy_format(bidix_data)
    
    # Count entries (excluding metadata)
    entry_count = len([k for k in legacy_data.keys() if k != 'metadata'])
    
    # Save output
    args.output.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Writing legacy dictionary to {args.output}...")
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(legacy_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Legacy vortaro export complete!")
    print(f"   Total Ido words: {entry_count:,}")
    print(f"   Output: {args.output}")
    print(f"   Format: Legacy (compatible with current vortaro UI)")


if __name__ == '__main__':
    main()






