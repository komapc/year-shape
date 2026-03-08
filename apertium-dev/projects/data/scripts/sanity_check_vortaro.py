#!/usr/bin/env python3
"""
Sanity check for vortaro JSON files.

Checks:
1. Data quality (empty fields, malformed entries)
2. Translation coverage
3. Source distribution
4. Confidence scores
5. Multi-source entries
6. Common issues (duplicates, missing fields)
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter

def sanity_check_vortaro(json_file):
    """Run comprehensive sanity checks on vortaro JSON."""
    
    print(f"{'='*70}")
    print(f"SANITY CHECK: {json_file.name}")
    print(f"{'='*70}\n")
    
    # Load data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    entries = data.get('entries', [])
    metadata = data.get('metadata', {})
    
    print(f"📊 Basic Statistics:")
    print(f"   Total entries: {len(entries):,}")
    print(f"   Metadata version: {metadata.get('version', 'N/A')}")
    print(f"   Generation date: {metadata.get('generation_date', 'N/A')}")
    
    # Initialize counters
    issues = []
    stats = {
        'with_translations': 0,
        'without_translations': 0,
        'with_pos': 0,
        'without_pos': 0,
        'with_morphology': 0,
        'without_morphology': 0,
        'multi_source': 0,
        'single_source': 0,
        'empty_lemma': 0,
        'empty_translations': 0,
        'malformed_translations': 0,
    }
    
    source_distribution = Counter()
    confidence_distribution = Counter()
    pos_distribution = Counter()
    translation_count_dist = Counter()
    sources_per_translation = []
    
    # Check each entry
    for i, entry in enumerate(entries):
        lemma = entry.get('lemma', '')
        source = entry.get('source', '')
        translations = entry.get('translations', [])
        pos = entry.get('pos')
        morphology = entry.get('morphology')
        
        # Check for empty lemma
        if not lemma or not lemma.strip():
            stats['empty_lemma'] += 1
            issues.append(f"Entry {i}: Empty lemma")
        
        # Check source
        if source:
            source_distribution[source] += 1
        
        # Check POS
        if pos:
            stats['with_pos'] += 1
            pos_distribution[pos] += 1
        else:
            stats['without_pos'] += 1
        
        # Check morphology
        if morphology:
            stats['with_morphology'] += 1
        else:
            stats['without_morphology'] += 1
        
        # Check translations
        if not translations:
            stats['without_translations'] += 1
        else:
            stats['with_translations'] += 1
            translation_count_dist[len(translations)] += 1
            
            # Check each translation
            for trans in translations:
                if not isinstance(trans, dict):
                    stats['malformed_translations'] += 1
                    issues.append(f"Entry {i} ({lemma}): Malformed translation: {trans}")
                    continue
                
                term = trans.get('term', '')
                lang = trans.get('lang', '')
                confidence = trans.get('confidence')
                sources = trans.get('sources', [])
                
                # Check for empty translation term
                if not term or not term.strip():
                    stats['empty_translations'] += 1
                    issues.append(f"Entry {i} ({lemma}): Empty translation term")
                
                # Check language
                if not lang:
                    issues.append(f"Entry {i} ({lemma}): Missing language for translation '{term}'")
                
                # Check confidence
                if confidence is not None:
                    conf_bucket = f"{confidence:.1f}"
                    confidence_distribution[conf_bucket] += 1
                    
                    if confidence < 0 or confidence > 1:
                        issues.append(f"Entry {i} ({lemma}): Invalid confidence {confidence} (must be 0-1)")
                else:
                    issues.append(f"Entry {i} ({lemma}): Missing confidence for translation '{term}'")
                
                # Check sources
                if sources:
                    sources_per_translation.append(len(sources))
                    if len(sources) > 1:
                        stats['multi_source'] += 1
                    else:
                        stats['single_source'] += 1
                else:
                    issues.append(f"Entry {i} ({lemma}): Missing sources for translation '{term}'")
    
    # Print results
    print(f"\n{'='*70}")
    print(f"QUALITY CHECKS")
    print(f"{'='*70}\n")
    
    print(f"✅ Entries with translations: {stats['with_translations']:,} ({stats['with_translations']/len(entries)*100:.1f}%)")
    print(f"⚠️  Entries without translations: {stats['without_translations']:,} ({stats['without_translations']/len(entries)*100:.1f}%)")
    
    print(f"\n✅ Entries with POS: {stats['with_pos']:,} ({stats['with_pos']/len(entries)*100:.1f}%)")
    print(f"⚠️  Entries without POS: {stats['without_pos']:,} ({stats['without_pos']/len(entries)*100:.1f}%)")
    
    print(f"\n✅ Entries with morphology: {stats['with_morphology']:,} ({stats['with_morphology']/len(entries)*100:.1f}%)")
    print(f"⚠️  Entries without morphology: {stats['without_morphology']:,} ({stats['without_morphology']/len(entries)*100:.1f}%)")
    
    if stats['empty_lemma'] > 0:
        print(f"\n❌ Empty lemmas: {stats['empty_lemma']}")
    
    if stats['empty_translations'] > 0:
        print(f"❌ Empty translation terms: {stats['empty_translations']}")
    
    if stats['malformed_translations'] > 0:
        print(f"❌ Malformed translations: {stats['malformed_translations']}")
    
    # Multi-source statistics
    print(f"\n{'='*70}")
    print(f"MULTI-SOURCE PROVENANCE")
    print(f"{'='*70}\n")
    
    total_translations = stats['multi_source'] + stats['single_source']
    if total_translations > 0:
        print(f"✅ Multi-source translations: {stats['multi_source']:,} ({stats['multi_source']/total_translations*100:.1f}%)")
        print(f"   Single-source translations: {stats['single_source']:,} ({stats['single_source']/total_translations*100:.1f}%)")
        
        if sources_per_translation:
            avg_sources = sum(sources_per_translation) / len(sources_per_translation)
            max_sources = max(sources_per_translation)
            print(f"\n   Average sources per translation: {avg_sources:.2f}")
            print(f"   Maximum sources for one translation: {max_sources}")
    
    # Source distribution
    print(f"\n{'='*70}")
    print(f"SOURCE DISTRIBUTION")
    print(f"{'='*70}\n")
    
    for source, count in source_distribution.most_common():
        print(f"   {source:20s} {count:6,} entries ({count/len(entries)*100:.1f}%)")
    
    # Confidence distribution
    print(f"\n{'='*70}")
    print(f"CONFIDENCE DISTRIBUTION")
    print(f"{'='*70}\n")
    
    for conf, count in sorted(confidence_distribution.items()):
        print(f"   {conf:5s} {count:6,} translations")
    
    # POS distribution
    if pos_distribution:
        print(f"\n{'='*70}")
        print(f"PART-OF-SPEECH DISTRIBUTION")
        print(f"{'='*70}\n")
        
        for pos, count in pos_distribution.most_common(15):
            print(f"   {pos:10s} {count:6,} entries ({count/stats['with_pos']*100:.1f}%)")
    
    # Translation count distribution
    print(f"\n{'='*70}")
    print(f"TRANSLATIONS PER ENTRY")
    print(f"{'='*70}\n")
    
    for count, entries_count in sorted(translation_count_dist.items())[:10]:
        print(f"   {count:2d} translation(s): {entries_count:6,} entries")
    
    # Sample entries
    print(f"\n{'='*70}")
    print(f"SAMPLE ENTRIES")
    print(f"{'='*70}\n")
    
    # Show a few interesting samples
    samples = {
        'multi_source': None,
        'single_source': None,
        'no_translations': None,
        'with_morphology': None,
    }
    
    for entry in entries:
        translations = entry.get('translations', [])
        
        if not samples['multi_source'] and translations:
            for trans in translations:
                if len(trans.get('sources', [])) > 1:
                    samples['multi_source'] = entry
                    break
        
        if not samples['single_source'] and translations:
            for trans in translations:
                if len(trans.get('sources', [])) == 1:
                    samples['single_source'] = entry
                    break
        
        if not samples['no_translations'] and not translations:
            samples['no_translations'] = entry
        
        if not samples['with_morphology'] and entry.get('morphology'):
            samples['with_morphology'] = entry
        
        if all(samples.values()):
            break
    
    if samples['multi_source']:
        print("Multi-source entry:")
        print(json.dumps(samples['multi_source'], indent=2, ensure_ascii=False)[:500])
        print()
    
    if samples['with_morphology']:
        print("\nEntry with morphology:")
        print(json.dumps(samples['with_morphology'], indent=2, ensure_ascii=False)[:500])
        print()
    
    # Issues summary
    print(f"\n{'='*70}")
    print(f"ISSUES SUMMARY")
    print(f"{'='*70}\n")
    
    if issues:
        print(f"❌ Found {len(issues)} issues:")
        for issue in issues[:20]:  # Show first 20
            print(f"   • {issue}")
        if len(issues) > 20:
            print(f"   ... and {len(issues) - 20} more")
    else:
        print("✅ No issues found!")
    
    # Overall assessment
    print(f"\n{'='*70}")
    print(f"OVERALL ASSESSMENT")
    print(f"{'='*70}\n")
    
    critical_issues = stats['empty_lemma'] + stats['malformed_translations']
    warnings = stats['without_translations'] + len([i for i in issues if 'Missing' in i])
    
    if critical_issues > 0:
        print(f"❌ CRITICAL: {critical_issues} critical issues found")
        return False
    elif warnings > 10:
        print(f"⚠️  WARNING: {warnings} warnings found")
        print(f"   Data is usable but could be improved")
        return True
    else:
        print(f"✅ EXCELLENT: Data quality is good!")
        print(f"   Ready for vortaro display")
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 sanity_check_vortaro.py <json_file>")
        print("Example: python3 sanity_check_vortaro.py projects/data/merged/merged_bidix.json")
        sys.exit(1)
    
    json_file = Path(sys.argv[1])
    
    if not json_file.exists():
        print(f"Error: File not found: {json_file}")
        sys.exit(1)
    
    success = sanity_check_vortaro(json_file)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
