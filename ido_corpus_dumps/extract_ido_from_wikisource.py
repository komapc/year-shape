#!/usr/bin/env python3
"""
Extract Ido language pages from multilingual Wikisource XML dump.

This script parses the sourceswiki XML dump and extracts only pages
that are identified as Ido language content.
"""

import bz2
import xml.etree.ElementTree as ET
import json
import sys
import re
from pathlib import Path


def is_ido_page(title, text, ns):
    """
    Determine if a page is Ido content based on various indicators.
    
    Args:
        title: Page title
        text: Page content (wikitext)
        ns: Namespace ID
        
    Returns:
        bool: True if the page is identified as Ido content
    """
    if text is None:
        return False
    
    # Check namespace - 0 is main article namespace
    if ns != '0':
        # Check for Ido-specific namespaces or categories
        if not any(marker in title for marker in ['Ido:', '/Ido', 'Categoria:Id Ido']):
            return False
    
    # Check for Ido language indicators in the text
    ido_indicators = [
        r'{{Language\|io}}',
        r'{{language\|io}}',
        r'\[\[Category:Id Ido',
        r'\[\[Kategorii:Id Ido',
        r'{{Ido',
        'lang="io"',
        "lang='io'",
    ]
    
    for indicator in ido_indicators:
        if re.search(indicator, text, re.IGNORECASE):
            return True
    
    # Check title for Ido-specific patterns
    title_lower = title.lower()
    if any(pattern in title_lower for pattern in ['/ido', ':ido', 'ido/']):
        return True
    
    return False


def extract_ido_pages(dump_file, output_file=None, output_format='json'):
    """
    Extract Ido pages from Wikisource dump.
    
    Args:
        dump_file: Path to the .xml.bz2 dump file
        output_file: Path to output file (stdout if None)
        output_format: 'json' or 'txt'
    """
    dump_path = Path(dump_file)
    if not dump_path.exists():
        print(f"Error: File not found: {dump_file}", file=sys.stderr)
        return
    
    print(f"Processing dump: {dump_file}", file=sys.stderr)
    print(f"This may take several minutes...", file=sys.stderr)
    
    count = 0
    ido_count = 0
    
    # Open output file if specified
    if output_file:
        out = open(output_file, 'w', encoding='utf-8')
    else:
        out = sys.stdout
    
    try:
        with bz2.open(dump_file, 'rt', encoding='utf-8') as f:
            # Use iterparse for memory-efficient processing
            context = ET.iterparse(f, events=('end',))
            
            for event, elem in context:
                if elem.tag.endswith('page'):
                    count += 1
                    
                    # Extract page information
                    title_elem = elem.find('.//{http://www.mediawiki.org/xml/export-0.10/}title')
                    text_elem = elem.find('.//{http://www.mediawiki.org/xml/export-0.10/}text')
                    ns_elem = elem.find('.//{http://www.mediawiki.org/xml/export-0.10/}ns')
                    id_elem = elem.find('.//{http://www.mediawiki.org/xml/export-0.10/}id')
                    
                    title = title_elem.text if title_elem is not None else ''
                    text = text_elem.text if text_elem is not None else ''
                    ns = ns_elem.text if ns_elem is not None else '0'
                    page_id = id_elem.text if id_elem is not None else ''
                    
                    # Check if this is an Ido page
                    if is_ido_page(title, text, ns):
                        ido_count += 1
                        
                        if output_format == 'json':
                            page_data = {
                                'id': page_id,
                                'title': title,
                                'namespace': ns,
                                'text': text,
                            }
                            out.write(json.dumps(page_data, ensure_ascii=False) + '\n')
                        else:  # txt format
                            out.write(f"=== {title} ===\n")
                            out.write(text)
                            out.write("\n\n" + "="*80 + "\n\n")
                        
                        if ido_count % 10 == 0:
                            print(f"Found {ido_count} Ido pages (scanned {count} total pages)", 
                                  file=sys.stderr)
                    
                    # Progress indicator
                    if count % 10000 == 0:
                        print(f"Scanned {count} pages, found {ido_count} Ido pages", 
                              file=sys.stderr)
                    
                    # Clear element to free memory
                    elem.clear()
        
        print(f"\nDone! Scanned {count} total pages", file=sys.stderr)
        print(f"Found {ido_count} Ido pages", file=sys.stderr)
        
    finally:
        if output_file and out != sys.stdout:
            out.close()


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Extract Ido language pages from Wikisource XML dump',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract to JSON file (one page per line)
  python extract_ido_from_wikisource.py sourceswiki-latest-pages-articles.xml.bz2 -o ido_pages.jsonl
  
  # Extract to plain text file
  python extract_ido_from_wikisource.py sourceswiki-latest-pages-articles.xml.bz2 -o ido_pages.txt -f txt
  
  # Output to stdout
  python extract_ido_from_wikisource.py sourceswiki-latest-pages-articles.xml.bz2
        """
    )
    
    parser.add_argument('dump_file', help='Path to Wikisource XML dump file (.xml.bz2)')
    parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    parser.add_argument('-f', '--format', choices=['json', 'txt'], default='json',
                       help='Output format (default: json)')
    
    args = parser.parse_args()
    
    extract_ido_pages(args.dump_file, args.output, args.format)


if __name__ == '__main__':
    main()

