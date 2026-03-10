#!/usr/bin/env python3
"""
Diagnose why critical words are missing from generated dictionaries.

Checks:
1. If words exist in source JSON files
2. If words exist in merged JSON files
3. Why they're filtered out during generation
"""

import json
import sys
from pathlib import Path

def check_word(word: str, sources_dir: Path, merged_dir: Path):
    """Check if a word exists in sources and merged files."""
    print(f"\n{'='*70}")
    print(f"Checking word: '{word}'")
    print(f"{'='*70}")
    
    # Check sources
    print("\n📋 SOURCE FILES:")
    found_in_sources = False
    for source_file in sorted(sources_dir.glob('source_*.json')):
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            entries = [e for e in data.get('entries', []) if e.get('lemma') == word]
            if entries:
                found_in_sources = True
                entry = entries[0]
                print(f"  ✅ Found in {source_file.name}:")
                print(f"     Source: {entry.get('source')}")
                print(f"     POS: {entry.get('pos', 'N/A')}")
                print(f"     Paradigm: {entry.get('morphology', {}).get('paradigm', 'N/A')}")
                translations = entry.get('translations', [])
                print(f"     Translations: {len(translations)}")
                for trans in translations[:3]:  # Show first 3
                    print(f"       - {trans.get('term')} (confidence: {trans.get('confidence')}, lang: {trans.get('lang')})")
        except Exception as e:
            print(f"  ⚠️  Error reading {source_file.name}: {e}")
    
    if not found_in_sources:
        print(f"  ❌ NOT FOUND in any source file")
    
    # Check merged files
    print("\n🔄 MERGED FILES:")
    merged_bidix = merged_dir / 'merged_bidix.json'
    merged_monodix = merged_dir / 'merged_monodix.json'
    
    if merged_bidix.exists():
        try:
            with open(merged_bidix, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            entries = [e for e in data.get('entries', []) if e.get('lemma') == word]
            if entries:
                entry = entries[0]
                print(f"  ✅ Found in merged_bidix.json:")
                print(f"     Source: {entry.get('source')}")
                print(f"     POS: {entry.get('pos', 'N/A')}")
                print(f"     Paradigm: {entry.get('morphology', {}).get('paradigm', 'N/A')}")
                translations = entry.get('translations', [])
                print(f"     Translations: {len(translations)}")
                
                # Check confidence levels
                eo_translations = [t for t in translations if t.get('lang') == 'eo']
                if eo_translations:
                    confidences = [t.get('confidence', 0) for t in eo_translations]
                    max_conf = max(confidences)
                    min_conf = min(confidences)
                    print(f"     Esperanto translations confidence: {min_conf:.2f} - {max_conf:.2f}")
                    print(f"     ⚠️  FILTERED OUT if min_confidence > {max_conf:.2f}")
                    
                    for trans in eo_translations[:3]:
                        print(f"       - {trans.get('term')} (confidence: {trans.get('confidence')})")
                else:
                    print(f"     ❌ No Esperanto translations")
            else:
                print(f"  ❌ NOT FOUND in merged_bidix.json")
        except Exception as e:
            print(f"  ⚠️  Error reading merged_bidix.json: {e}")
    
    if merged_monodix.exists():
        try:
            with open(merged_monodix, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            entries = [e for e in data.get('entries', []) if e.get('lemma') == word]
            if entries:
                print(f"  ✅ Found in merged_monodix.json")
            else:
                print(f"  ❌ NOT FOUND in merged_monodix.json")
        except Exception as e:
            print(f"  ⚠️  Error reading merged_monodix.json: {e}")
    
    # Check generated dictionary
    print("\n📖 GENERATED DICTIONARY:")
    generated_bidix = Path(__file__).parent.parent / 'generated' / 'ido-epo.ido-epo.dix'
    if generated_bidix.exists():
        with open(generated_bidix, 'r', encoding='utf-8') as f:
            content = f.read()
            if f'<l>{word}</l>' in content or f'<l>{word}<' in content:
                print(f"  ✅ Found in generated bidix")
            else:
                print(f"  ❌ NOT FOUND in generated bidix")
                print(f"     Reason: Likely filtered by confidence threshold (default: 0.9)")
    else:
        print(f"  ⚠️  Generated bidix not found")

def main():
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    sources_dir = data_dir / 'sources'
    merged_dir = data_dir / 'merged'
    
    # Critical missing words
    words_to_check = ['e', 'maxim', 'quin', 'Paris', 'kreesis']
    
    print("="*70)
    print("DIAGNOSING MISSING WORDS")
    print("="*70)
    
    for word in words_to_check:
        check_word(word, sources_dir, merged_dir)
    
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print("\nCommon issues:")
    print("1. Confidence threshold too high (default: 0.9)")
    print("   - BERT embeddings have confidence 0.85")
    print("   - Solution: Lower min_confidence or improve BERT translations")
    print("\n2. Missing from source files")
    print("   - Solution: Add to appropriate source file")
    print("\n3. No Esperanto translations")
    print("   - Solution: Add translations to source file")

if __name__ == '__main__':
    main()

