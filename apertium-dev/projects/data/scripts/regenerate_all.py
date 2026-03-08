#!/usr/bin/env python3
"""
Master script to regenerate all Apertium dictionaries from unified JSON sources.

This script:
1. Validates all source JSON files
2. Merges all sources with intelligent deduplication
3. Generates monodix (Ido monolingual dictionary)
4. Generates bidix (Ido-Esperanto bilingual dictionary)
5. Optionally validates generated XML files

Usage:
    python3 regenerate_all.py [--validate-xml] [--min-confidence 0.7]
"""

import argparse
import sys
from pathlib import Path
import subprocess

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from validate_schema import load_schema, validate_file
from merge_sources import merge_all_sources, separate_bidix_monodix
from generate_monodix import generate_monodix
from generate_bidix import generate_bidix
import json


def run_command(cmd: list, description: str) -> bool:
    """Run a shell command and report success/failure."""
    print(f"\n{'='*60}")
    print(f"▶ {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False


def validate_xml(file_path: Path) -> bool:
    """Validate XML file with xmllint."""
    print(f"\n▶ Validating XML: {file_path}")
    
    try:
        result = subprocess.run(
            ['xmllint', '--noout', str(file_path)],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ Valid XML: {file_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Invalid XML: {file_path}")
        print(e.stderr)
        return False
    except FileNotFoundError:
        print("⚠️  xmllint not found - skipping XML validation")
        return True


def main():
    parser = argparse.ArgumentParser(
        description='Regenerate all Apertium dictionaries from unified JSON sources'
    )
    parser.add_argument(
        '--validate-xml',
        action='store_true',
        help='Validate generated XML files with xmllint'
    )
    parser.add_argument(
        '--min-confidence',
        type=float,
        default=0.9,
        help='Minimum confidence threshold for bidix entries (default: 0.9)'
    )
    parser.add_argument(
        '--no-pos',
        action='store_true',
        help='Do not add POS tags to bidix entries'
    )
    parser.add_argument(
        '--skip-validation',
        action='store_true',
        help='Skip source JSON schema validation'
    )
    parser.add_argument(
        '--skip-merge',
        action='store_true',
        help='Skip merging (use existing merged files)'
    )
    
    args = parser.parse_args()
    
    # Set up paths
    base_dir = Path(__file__).parent.parent
    sources_dir = base_dir / 'sources'
    merged_dir = base_dir / 'merged'
    generated_dir = base_dir / 'generated'
    schema_path = base_dir / 'schema.json'
    
    merged_monodix = merged_dir / 'merged_monodix.json'
    merged_bidix = merged_dir / 'merged_bidix.json'
    
    output_monodix = generated_dir / 'ido.ido.dix'
    output_bidix = generated_dir / 'ido-epo.ido-epo.dix'
    
    # Create directories
    merged_dir.mkdir(parents=True, exist_ok=True)
    generated_dir.mkdir(parents=True, exist_ok=True)
    
    print("="*60)
    print("🚀 Apertium Dictionary Regeneration Pipeline")
    print("="*60)
    print(f"Sources: {sources_dir}")
    print(f"Merged: {merged_dir}")
    print(f"Generated: {generated_dir}")
    print(f"Min confidence: {args.min_confidence}")
    print(f"Add POS tags: {not args.no_pos}")
    
    # Load schema
    print(f"\nLoading schema: {schema_path}")
    schema = load_schema(schema_path)
    
    # Step 1: Validate source JSON files
    if not args.skip_validation:
        print("\n" + "="*60)
        print("📋 STEP 1: Validate Source JSON Files")
        print("="*60)
        
        json_files = list(sources_dir.glob('source_*.json'))
        if not json_files:
            print(f"⚠️  No source_*.json files found in {sources_dir}")
        
        all_valid = True
        for json_file in json_files:
            is_valid, errors = validate_file(json_file, schema)
            if is_valid:
                print(f"✅ {json_file.name}: Valid")
            else:
                print(f"❌ {json_file.name}: INVALID")
                for error in errors:
                    print(f"  {error}")
                all_valid = False
        
        if not all_valid:
            print("\n❌ Source validation failed!")
            return 1
        
        print("\n✅ All source files validated successfully")
    else:
        print("\n⏭️  Skipping source validation")
    
    # Step 2: Merge all sources
    if not args.skip_merge:
        print("\n" + "="*60)
        print("🔄 STEP 2: Merge All Sources")
        print("="*60)
        
        try:
            merged_data = merge_all_sources(sources_dir, schema)
            bidix_data, monodix_data = separate_bidix_monodix(merged_data)
            
            # Save merged files
            with open(merged_bidix, 'w', encoding='utf-8') as f:
                json.dump(bidix_data, f, indent=2, ensure_ascii=False)
            with open(merged_monodix, 'w', encoding='utf-8') as f:
                json.dump(monodix_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n✅ Merge complete")
            print(f"  Monodix: {merged_monodix} ({len(monodix_data['entries']):,} entries)")
            print(f"  Bidix: {merged_bidix} ({len(bidix_data['entries']):,} entries)")
        except Exception as e:
            print(f"\n❌ Merge failed: {e}")
            import traceback
            traceback.print_exc()
            return 1
    else:
        print("\n⏭️  Skipping merge (using existing merged files)")
    
    # Step 3: Generate monodix
    print("\n" + "="*60)
    print("📖 STEP 3: Generate Monodix")
    print("="*60)
    
    try:
        generate_monodix(merged_monodix, output_monodix)
        print(f"\n✅ Monodix generated: {output_monodix}")
    except Exception as e:
        print(f"\n❌ Monodix generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Step 4: Generate bidix
    print("\n" + "="*60)
    print("📚 STEP 4: Generate Bidix")
    print("="*60)
    
    try:
        generate_bidix(merged_bidix, output_bidix, args.min_confidence, add_pos=not args.no_pos)
        print(f"\n✅ Bidix generated: {output_bidix}")
    except Exception as e:
        print(f"\n❌ Bidix generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Step 5: Validate XML (optional)
    if args.validate_xml:
        print("\n" + "="*60)
        print("✓ STEP 5: Validate Generated XML")
        print("="*60)
        
        xml_valid = True
        xml_valid &= validate_xml(output_monodix)
        xml_valid &= validate_xml(output_bidix)
        
        if not xml_valid:
            print("\n⚠️  Some XML files failed validation")
            return 1
        
        print("\n✅ All XML files are valid")
    
    # Summary
    print("\n" + "="*60)
    print("🎉 REGENERATION COMPLETE")
    print("="*60)
    print(f"✅ Monodix: {output_monodix}")
    print(f"✅ Bidix: {output_bidix}")
    print("\nNext steps:")
    print("  1. Copy generated files to apertium/ directories")
    print("  2. Compile dictionaries with Apertium tools")
    print("  3. Test translation pipeline")
    print("  4. Export for vortaro display")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())

