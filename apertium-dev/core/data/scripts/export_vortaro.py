#!/usr/bin/env python3
"""
Export merged bidix to vortaro JSON format.

The vortaro format includes multi-source provenance for transparency.

Input: merged_bidix.json
Output: vortaro_dictionary.json

Format:
{
  "version": "1.0",
  "generation_date": "2025-12-04",
  "entries": [
    {
      "lemma": "kavalo",
      "translations": [
        {
          "term": "ĉevalo",
          "lang": "eo",
          "confidence": 1.0,
          "sources": ["io_wiktionary", "en_pivot"]
        }
      ],
      "pos": "n",
      "source_details": {
        "primary_source": "io_wiktionary",
        "all_sources": ["io_wiktionary", "en_pivot"]
      }
    }
  ]
}
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List


def convert_to_vortaro_format(bidix_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert merged bidix format to vortaro format."""
    
    entries = bidix_data.get('entries', [])
    metadata = bidix_data.get('metadata', {})
    stats = metadata.get('statistics', {})
    
    vortaro_entries = []
    
    for entry in entries:
        lemma = entry.get('lemma', '')
        if not lemma:
            continue
        
        translations = entry.get('translations', [])
        if not translations:
            continue
        
        pos = entry.get('pos')
        source = entry.get('source')
        entry_metadata = entry.get('metadata', {})
        
        # Collect all sources
        all_sources = set()
        if source:
            all_sources.add(source)
        
        merged_from = entry_metadata.get('merged_from_sources', [])
        all_sources.update(merged_from)
        
        # Get sources from translations
        for trans in translations:
            trans_sources = trans.get('sources', [])
            all_sources.update(trans_sources)
        
        all_sources = sorted(list(all_sources))
        
        vortaro_entry = {
            'lemma': lemma,
            'translations': translations,
        }
        
        if pos:
            vortaro_entry['pos'] = pos
        
        # Add source details for transparency
        vortaro_entry['source_details'] = {
            'primary_source': source or (all_sources[0] if all_sources else 'unknown'),
            'all_sources': all_sources
        }
        
        # Add morphology if available
        morphology = entry.get('morphology')
        if morphology:
            vortaro_entry['morphology'] = morphology
        
        vortaro_entries.append(vortaro_entry)
    
    # Create vortaro format
    vortaro_data = {
        'version': '1.0',
        'generation_date': datetime.now().isoformat(),
        'statistics': {
            'total_entries': len(vortaro_entries),
            'original_sources': stats.get('sources', {}),
            'generation_info': {
                'from_merged_bidix': True,
                'unified_format': True
            }
        },
        'entries': vortaro_entries
    }
    
    return vortaro_data


def main():
    parser = argparse.ArgumentParser(
        description='Export merged bidix to vortaro format'
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
        default=Path(__file__).parent.parent / 'generated' / 'vortaro_dictionary.json',
        help='Output vortaro JSON file'
    )
    
    args = parser.parse_args()
    
    print(f"Loading merged bidix from {args.input}...")
    with open(args.input, 'r', encoding='utf-8') as f:
        bidix_data = json.load(f)
    
    print(f"Converting to vortaro format...")
    vortaro_data = convert_to_vortaro_format(bidix_data)
    
    # Save output
    args.output.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Writing vortaro dictionary to {args.output}...")
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(vortaro_data, f, indent=2, ensure_ascii=False)
    
    stats = vortaro_data.get('statistics', {})
    print(f"\n✅ Vortaro export complete!")
    print(f"   Total entries: {stats.get('total_entries', 0):,}")
    print(f"   Output: {args.output}")
    
    # Sample entries for review
    sample_entries = vortaro_data['entries'][:5]
    print(f"\n📋 Sample entries:")
    for i, entry in enumerate(sample_entries, 1):
        lemma = entry['lemma']
        translations = entry.get('translations', [])
        sources = entry.get('source_details', {}).get('all_sources', [])
        trans_str = ', '.join(t['term'] for t in translations[:3])
        print(f"   {i}. {lemma} → {trans_str} (sources: {', '.join(sources)})")


if __name__ == '__main__':
    main()


