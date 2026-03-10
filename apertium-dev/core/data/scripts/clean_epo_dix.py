#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET
import re

def clean_dix(input_path, output_path):
    print(f"Cleaning {input_path}...")
    
    # We use a custom parser to preserve comments as much as possible, 
    # but standard ET is safer for now.
    tree = ET.parse(input_path)
    root = tree.getroot()
    
    # 1. DO NOT remove paradigms - too risky for references
    # But we can still fix the la__det paradigm specifically
    for pardef in root.findall('.//pardef'):
        if pardef.get('n') == 'la__det':
            for e in pardef.findall('e'):
                if e.get('r') == 'LR':
                    e.attrib.pop('r')
                    break # Only fix the first one

    # 2. Remove duplicate entries in main section
    sections = root.findall('section')
    for section in sections:
        if section.get('id') == 'main':
            # Group entries by lemma
            lemma_groups = {}
            for entry in section.findall('e'):
                lm = entry.get('lm')
                if not lm: continue
                
                lm_str = str(lm)
                if lm_str not in lemma_groups:
                    lemma_groups[lm_str] = []
                lemma_groups[lm_str].append(entry)
            
            # For each group, decide which one to keep
            to_remove = []
            for lm_str, entries in lemma_groups.items():
                if len(entries) > 1:
                    # HEURISTIC: Keep the one with the most <s/> tags (most specific)
                    # or the one that is not marked as LR
                    best_entry = entries[0]
                    max_tags = 0
                    
                    for candidate in entries:
                        num_tags = len(candidate.findall('.//s'))
                        is_lr = candidate.get('r') == 'LR'
                        
                        # Score: more tags is better, NOT being LR is better
                        score = num_tags + (0 if is_lr else 10)
                        
                        current_best_lr = best_entry.get('r') == 'LR'
                        current_best_score = len(best_entry.findall('.//s')) + (0 if current_best_lr else 10)
                        
                        if score > current_best_score:
                            best_entry = candidate
                    
                    # Remove all others
                    for e in entries:
                        if e != best_entry:
                            to_remove.append(e)
            
            for e in to_remove:
                section.remove(e)
            print(f"  Removed {len(to_remove)} duplicate entries from main section")

    tree.write(output_path, encoding='UTF-8', xml_declaration=True)
    print(f"✅ Successfully cleaned dix: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: clean_epo_dix.py input.dix output.dix")
        sys.exit(1)
    clean_dix(sys.argv[1], sys.argv[2])
