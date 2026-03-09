#!/usr/bin/env python3
"""
Generate Apertium monodix (.dix) file from merged JSON.

Reads: projects/data/merged/merged_monodix.json
Outputs: Apertium monolingual dictionary XML file

Usage:
    python3 generate_monodix.py --input merged_monodix.json --output ido.ido.dix

CRITICAL RULE: NEVER add words manually to dictionary files (.dix).
All dictionary entries MUST be generated from source JSON files.
If a word is missing, add it to the appropriate source file and regenerate.
"""

import json
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional
import re


# POS mapping from JSON to Apertium symbol definitions
PARADIGM_NORMALIZE = {
    'det': '__det',
    'pr': '__pr',
    'prn': '__prn',
    'cnjcoo': '__cnjcoo',
    'cnjsub': '__cnjsub',
    'adv': '__adv',
    'num': 'num',
    'ord': 'ma__ord',
    '__invar_verb': '__invar_verb',
}

POS_MAP = {
    'n': 'n',           # noun
    'noun': 'n',        # noun (full name)
    'v': 'vblex',       # verb
    'verb': 'vblex',    # verb (full name)
    'adj': 'adj',       # adjective
    'adjective': 'adj', # adjective (full name)
    'adv': 'adv',       # adverb
    'adverb': 'adv',    # adverb (full name)
    'pr': '__pr',         # preposition
    'prep': '__pr',       # preposition (alt)
    'preposition': '__pr',# preposition (full name)
    'prn': '__prn',       # pronoun
    'pronoun': '__prn',   # pronoun (full name)
    'det': '__det',       # determiner
    'determiner': '__det',# determiner (full name)
    'num': 'num',         # numeral
    'numeral': 'num',     # numeral (full name)
    'ord': 'ma__ord',     # ordinal
    'ordinal': 'ma__ord', # ordinal (full name)
    'cnjcoo': '__cnjcoo', # coordinating conjunction
    'conjunction': '__cnjcoo', # conjunction (default to coo)
    'cnjsub': '__cnjsub', # subordinating conjunction
    'ij': 'ij',         # interjection
    'interjection': 'ij',# interjection (full name)
}


_JUNK_LEMMA_RE = re.compile(r'[\d,;()%²³]')

def is_valid_lemma(lemma: str, stem: Optional[str] = None) -> bool:
    """Return False for numbers, dates, units, and other non-word noise."""
    if not lemma:
        return False
    if _JUNK_LEMMA_RE.search(lemma):
        return False
    
    # Filter out participle stems that often appear as junk lemmas from BERT/Wikipedia
    # Examples: "facit", "kreit", "donant", "iront"
    # We check both the lemma and the extracted stem
    for text in [lemma.lower(), stem.lower() if stem else ""]:
        if not text: continue
        if text.endswith(('it', 'ant', 'int', 'ont', 'at', 'ot')):
            # Allow-list for valid short words that happen to end in these suffixes
            if text in {'kant', 'sant', 'granit', 'spirit', 'vundit', 'esperant', 'konstrukt', 'fac', 'dikant', 'indikant', 'sat', 'sucesoz', 'maxim'}:
                continue
            return False
        
    return True


def extract_stem_ido(lemma: str, pos: Optional[str], paradigm: Optional[str]) -> str:
    """
    Extract the stem from an Ido lemma based on POS and paradigm.
    """
    if not lemma:
        return ""
    
    # If paradigm is specified, use it
    if paradigm:
        if paradigm.startswith('o__'):  # noun paradigm
            return lemma.rstrip('o') if lemma.endswith('o') else lemma
        elif paradigm.startswith('ar__'):  # verb paradigm
            return lemma.rstrip('ar') if lemma.endswith('ar') else lemma
        elif paradigm.startswith('a__'):  # adjective paradigm
            return lemma.rstrip('a') if lemma.endswith('a') else lemma
        elif paradigm == 'ebl__adj':  # -ebl adjective paradigm (verb stem + ebla)
            if lemma.endswith('ebla'):
                return lemma[:-4]
            return lemma.rstrip('a') if lemma.endswith('a') else lemma
        elif paradigm.startswith('e__'):  # adverb paradigm
            return lemma.rstrip('e') if lemma.endswith('e') else lemma
        elif paradigm == 'np__np':  # proper noun paradigm
            return lemma
        elif paradigm == 'ma__ord':  # ordinal paradigm
            if lemma.endswith('esma'):
                return lemma[:-4]  # unesma -> un
            elif lemma.endswith('ma'):
                return lemma[:-2]  # dekma -> dek
            return lemma
        elif paradigm == 'num':  # numeral paradigm
            return lemma
        elif paradigm.startswith('__'):  # invariable (no suffix)
            return lemma
    
    # Fallback: use POS
    if pos in ('ord', 'ordinal'):
        if lemma.endswith('esma'):
            return lemma[:-4]
        elif lemma.endswith('ma'):
            return lemma[:-2]
        return lemma
    
    if pos == 'num':
        return lemma

    if pos in ('np', 'proper noun'):
        return lemma
    if pos == 'n' and lemma.endswith('o'):
        return lemma[:-1]
    elif pos in ('v', 'vblex') and lemma.endswith('ar'):
        return lemma[:-2]
    elif pos == 'adj' and lemma.endswith('a'):
        return lemma[:-1]
    elif pos == 'adv' and lemma.endswith('e'):
        return lemma[:-1]
    
    # Return as-is for other cases
    return lemma


def create_entry_element(lemma: str, stem: str, paradigm: str) -> ET.Element:
    """
    Create a monodix entry element.
    
    Format:
    <e lm="lemma">
      <i>stem</i>
      <par n="paradigm"/>
    </e>
    """
    entry = ET.Element('e')
    entry.set('lm', lemma)
    
    i_elem = ET.SubElement(entry, 'i')
    i_elem.text = stem
    
    par_elem = ET.SubElement(entry, 'par')
    par_elem.set('n', paradigm)
    
    return entry


def generate_monodix(input_file: Path, output_file: Path, min_confidence: float = 0.0):
    """
    Generate Apertium monodix from merged JSON.
    
    Args:
        input_file: Path to merged_monodix.json
        output_file: Path to output .dix file
        min_confidence: Minimum confidence threshold (not used for monodix, kept for consistency)
    """
    print(f"Loading merged monodix from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    entries = data.get('entries', [])
    metadata = data.get('metadata', {})
    stats = metadata.get('statistics', {})
    
    print(f"Total entries: {len(entries)}")
    print(f"Statistics: {stats}")
    
    # Create root element
    root = ET.Element('dictionary')
    
    # Add alphabet
    alphabet = ET.SubElement(root, 'alphabet')
    alphabet.text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-'’"
    
    # Add symbol definitions
    sdefs = ET.SubElement(root, 'sdefs')
    
    # Standard Ido symbol definitions
    sdef_list = [
        # POS tags
        'n', 'adj', 'adv', 'vblex', 'pr', 'prn', 'det', 'num',
        'cnjcoo', 'cnjsub', 'ij', 'np',
        # Number
        'sg', 'pl', 'sp', 'def',
        # Case
        'nom', 'acc',
        # Verb tenses
        'inf', 'pri', 'pii', 'fti', 'cni', 'imp',
        # Participles
        'pp', 'pprs', 'pfut',  # past, present, future participle
        # Voice
        'act', 'pasv',  # active, passive
        # Person
        'p1', 'p2', 'p3',
        # Gender
        'm', 'f', 'mf', 'nt',
        # Proper noun subtypes
        'ant', 'cog', 'top', 'al',
        # Numeral
        'ciph', 'ord',
        # Legacy (for compatibility)
        'pres', 'past', 'fut', 'cond'
    ]
    
    for sdef_name in sdef_list:
        sdef = ET.SubElement(sdefs, 'sdef')
        sdef.set('n', sdef_name)
    
    # Add paradigm definitions
    pardefs = ET.SubElement(root, 'pardefs')
    
    # Load paradigms from external file if provided
    pardefs_file = input_file.parent.parent / 'pardefs.xml'
    if pardefs_file.exists():
        print(f"Loading paradigms from {pardefs_file}...")
        try:
            # Parse the pardefs file
            # We wrap it in a root element because the file might just be a list of <pardef>
            with open(pardefs_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # If it's not a full XML doc, wrap it
            if not content.strip().startswith('<?xml'):
                content = f"<root>{content}</root>"
            
            parsed_root = ET.fromstring(content)
            
            # Find all pardef elements (handle both <root><pardefs><pardef> and <root><pardef>)
            pardef_elements = parsed_root.findall('.//pardef')
            
            # Append children to pardefs element
            for child in pardef_elements:
                p_name = child.get('n')
                if p_name == 'ar__vblex':
                    # Inject participles into ar__vblex
                    participles = [
                        ('ita', 'pp', 'pasv', 'adj'), ('ite', 'pp', 'pasv', 'adv'), ('ito', 'pp', 'pasv', 'n'),
                        ('anta', 'pprs', 'act', 'adj'), ('ante', 'pprs', 'act', 'adv'), ('anto', 'pprs', 'act', 'n'),
                        ('inta', 'pp', 'act', 'adj'), ('inte', 'pp', 'act', 'adv'), ('into', 'pp', 'act', 'n'),
                        ('onta', 'pfut', 'act', 'adj'), ('onte', 'pfut', 'act', 'adv'), ('onto', 'pfut', 'act', 'n'),
                        ('ata', 'pprs', 'pasv', 'adj'), ('ate', 'pprs', 'pasv', 'adv'), ('ato', 'pprs', 'pasv', 'n'),
                        ('ota', 'pfut', 'pasv', 'adj'), ('ote', 'pfut', 'pasv', 'adv'), ('oto', 'pfut', 'pasv', 'n'),
                        ('esas', 'pri', 'pasv', None), ('esis', 'pii', 'pasv', None), ('esos', 'fti', 'pasv', None),
                        ('esus', 'cni', 'pasv', None), ('esez', 'imp', 'pasv', None), ('esar', 'inf', 'pasv', None)
                    ]
                    for t in participles:
                        # Only add if not already present in this pardef
                        if not any(l.text == t[0] for l in child.findall(".//l")):
                            e = ET.SubElement(child, 'e')
                            p = ET.SubElement(e, 'p')
                            ET.SubElement(p, 'l').text = t[0]
                            r = ET.SubElement(p, 'r')
                            ET.SubElement(r, 's', {'n': 'vblex'})
                            ET.SubElement(r, 's', {'n': t[1]})
                            if t[2]: ET.SubElement(r, 's', {'n': t[2]})
                            if t[3]: ET.SubElement(r, 's', {'n': t[3]})
                
                # Check if this paradigm is already in pardefs to avoid duplicates
                existing = pardefs.findall(f"./pardef[@n='{p_name}']")
                if not existing:
                    pardefs.append(child)
            
            # Programmatically inject num_ord_regex paradigm if missing
            if not pardefs.findall("./pardef[@n='num_ord_regex']"):
                ord_regex_pardef = ET.SubElement(pardefs, 'pardef', {'n': 'num_ord_regex'})
                # 16-ma case
                e_ord1 = ET.SubElement(ord_regex_pardef, 'e')
                ET.SubElement(e_ord1, 're').text = '[0-9]+'
                p_ord1 = ET.SubElement(e_ord1, 'p')
                ET.SubElement(p_ord1, 'l').text = '-ma'
                r_ord1 = ET.SubElement(p_ord1, 'r')
                r_ord1.text = '-a'
                ET.SubElement(r_ord1, 's', {'n': 'num'})
                ET.SubElement(r_ord1, 's', {'n': 'ord'})
                
                # 16ma case
                e_ord2 = ET.SubElement(ord_regex_pardef, 'e')
                ET.SubElement(e_ord2, 're').text = '[0-9]+'
                p_ord2 = ET.SubElement(e_ord2, 'p')
                ET.SubElement(p_ord2, 'l').text = 'ma'
                r_ord2 = ET.SubElement(p_ord2, 'r')
                r_ord2.text = '-a'
                ET.SubElement(r_ord2, 's', {'n': 'num'})
                ET.SubElement(r_ord2, 's', {'n': 'ord'})
            
            # Programmatically inject ma__ord paradigm if missing
            if not pardefs.findall("./pardef[@n='ma__ord']"):
                ma_ord_pardef = ET.SubElement(pardefs, 'pardef', {'n': 'ma__ord'})
                e_ma = ET.SubElement(ma_ord_pardef, 'e')
                p_ma = ET.SubElement(e_ma, 'p')
                ET.SubElement(p_ma, 'l').text = 'ma'
                r_ma = ET.SubElement(p_ma, 'r')
                ET.SubElement(r_ma, 's', {'n': 'num'})
                ET.SubElement(r_ma, 's', {'n': 'ord'})
                
                e_esma = ET.SubElement(ma_ord_pardef, 'e')
                p_esma = ET.SubElement(e_esma, 'p')
                ET.SubElement(p_esma, 'l').text = 'esma'
                r_esma = ET.SubElement(p_esma, 'r')
                ET.SubElement(r_esma, 's', {'n': 'num'})
                ET.SubElement(r_esma, 's', {'n': 'ord'})

            # Programmatically inject __invar_verb paradigm if missing
            if not pardefs.findall("./pardef[@n='__invar_verb']"):
                invar_verb_pardef = ET.SubElement(pardefs, 'pardef', {'n': '__invar_verb'})
                e_invar = ET.SubElement(invar_verb_pardef, 'e')
                p_invar = ET.SubElement(e_invar, 'p')
                ET.SubElement(p_invar, 'l').text = ""
                r_invar = ET.SubElement(p_invar, 'r')
                ET.SubElement(r_invar, 's', {'n': 'vblex'})
                ET.SubElement(r_invar, 's', {'n': 'pri'})
                
            print(f"  ✅ Total paradigms in dictionary: {len(pardefs.findall('pardef'))}")
                
        except Exception as e:
            print(f"WARNING: Failed to load paradigms: {e}")
            comment = ET.Comment(f' Failed to load paradigms: {e} ')
            pardefs.append(comment)
    else:
        comment = ET.Comment(' Paradigm definitions should be included here ')
        pardefs.append(comment)
        print(f"WARNING: pardefs.xml not found at {pardefs_file}")
    
    # Add section with entries
    section = ET.SubElement(root, 'section')
    section.set('id', 'main')
    section.set('type', 'standard')
    
    # Track statistics
    entries_added = 0
    entries_skipped_no_paradigm = 0
    entries_skipped_no_lemma = 0
    entries_skipped_junk = 0
    ebl_entries_generated = 0
    
    # Collect verb stems for -ebl generation
    verb_stems = set()
    processed_lemmas = set()
    
    # Store candidates for suffix-based generation
    suffix_candidates = [] # List of (derived_lemma, root_candidate, paradigm)
    
    # First pass: process existing entries and collect verb stems
    for entry in entries:
        lemma = entry.get('lemma', '').strip()
        
        if not lemma:
            entries_skipped_no_lemma += 1
            continue

        # Get morphology
        morphology = entry.get('morphology', {})
        paradigm = morphology.get('paradigm')
        pos = entry.get('pos')
        
        # FIX: Correct obviously wrong POS assignments
        lemma_lower = lemma.lower().strip()
        if lemma_lower == 'la' and (not pos or pos == 'adj'):
            pos = 'det'
        
        # Extract stem
        stem = extract_stem_ido(lemma, pos, paradigm)
        
        if not is_valid_lemma(lemma, stem):
            entries_skipped_junk += 1
            continue

        processed_lemmas.add(lemma.lower())
        
        # Check for suffix candidates (words that might be missing their roots or derived from them)
        if not paradigm:
            if lemma_lower.endswith('uro'):
                suffix_candidates.append((lemma, lemma[:-3], 'o__n'))
            elif lemma_lower.endswith('ala'):
                suffix_candidates.append((lemma, lemma[:-3], 'a__adj'))
            elif lemma_lower.endswith('eyo'):
                suffix_candidates.append((lemma, lemma[:-3], 'o__n'))
            elif lemma_lower.endswith('ino'):
                suffix_candidates.append((lemma, lemma[:-3], 'o__n'))
            elif lemma_lower.endswith('isto'):
                suffix_candidates.append((lemma, lemma[:-4], 'o__n'))
            elif lemma_lower.endswith('ana'):
                suffix_candidates.append((lemma, lemma[:-3], 'a__adj'))

        # If no paradigm, try to assign a default for invariable words
        if not paradigm:
            # For very short words or known function words, use default invariable paradigm
            lemma_lower = lemma.lower().strip()
            if lemma_lower == 'es':
                paradigm = '__invar_verb'
            elif '-' in lemma_lower and any(dir_root in lemma_lower for dir_root in {'nord', 'sud', 'est', 'west'}):
                if lemma_lower.endswith('e'):
                    paradigm = 'e__adv'
                elif lemma_lower.endswith('a'):
                    paradigm = 'a__adj'
                elif lemma_lower.endswith('o'):
                    paradigm = 'o__n'
            elif lemma_lower.endswith(('ma', 'esma')):
                paradigm = 'ma__ord'
            elif lemma_lower in {'un', 'du', 'tri', 'quar', 'kin', 'sis', 'sep', 'oko', 'non', 'dek', 'cent', 'mil', 'miliuno', 'miliardo'}:
                paradigm = 'num'
            elif len(lemma_lower) <= 3 or lemma_lower in {'por', 'de', 'en', 'e', 'od', 'per', 'ye', 'kom', 'di', 'da', 'til', 'pro', 'kun', 'sen', 'sur', 'sub', 'super', 'inter', 'kontre', 'dum', 'kad', 'ke', 'se', 'quar'}:
                # Use default invariable paradigm based on POS or guess
                if pos in {'pr', 'prep', 'preposition'}:
                    paradigm = '__pr'
                elif pos in {'cnjcoo', 'coordinating conjunction'}:
                    paradigm = '__cnjcoo'
                elif pos in {'cnjsub', 'subordinating conjunction'}:
                    paradigm = '__cnjsub'
                elif pos in {'adv', 'adverb'}:
                    # Short adverbs like 'ja' need an invariable adv paradigm
                    paradigm = '__adv'
                else:
                    # Default to preposition for short words without POS
                    paradigm = '__pr'
            # If still no paradigm and we know it's an adverb (but doesn't end in -e), use invariable adv
            if not paradigm and pos in {'adv', 'adverb'}:
                # Words ending in -e will later stem via e__adv; others can be treated as invariable adv
                if lemma_lower.endswith('e'):
                    paradigm = 'e__adv'
                else:
                    paradigm = '__adv'
            
            if not paradigm and pos in {'np', 'proper noun'}:
                paradigm = 'np__np'
            
            if not paradigm and pos in {'v', 'vblex', 'verb'} and lemma_lower.endswith('ar'):
                paradigm = 'ar__vblex'
            
            if not paradigm and pos in {'n', 'noun'} and lemma_lower.endswith('o'):
                paradigm = 'o__n'
            
        if not paradigm:
            entries_skipped_no_paradigm += 1
            continue

        # Collect verb stems for -ebl generation
        if pos in ('v', 'vblex', 'verb') and lemma.endswith('ar') and len(lemma) > 3:
            verb_stem = lemma[:-2]  # Remove -ar
            verb_stems.add(verb_stem)

        # Normalize paradigm name to match Apertium pardefs
        paradigm = PARADIGM_NORMALIZE.get(paradigm, paradigm)

        # Generate entry
        entry_elem = create_entry_element(lemma, stem, paradigm)
        section.append(entry_elem)
        entries_added += 1
    
    # Second pass: Generate -ebl adjective entries from verb stems
    # Only generate if the -ebl form doesn't already exist
    for verb_stem in verb_stems:
        ebl_lemma = verb_stem + 'ebla'
        
        # Skip if already exists
        if ebl_lemma.lower() in processed_lemmas:
            continue
        
        # Generate entry
        entry_elem = create_entry_element(ebl_lemma, verb_stem, 'ebl__adj')
        section.append(entry_elem)
        entries_added += 1
        ebl_entries_generated += 1
        processed_lemmas.add(ebl_lemma.lower())

    # Third pass: Process suffix candidates (morphological productivity)
    for derived_lemma, root_candidate, paradigm in suffix_candidates:
        # Check various possible root endings in Ido: -o (noun), -ar (verb), -a (adj)
        found_root = False
        final_root_stem = ""
        
        for root_ending in ['o', 'ar', 'a', 'e', '']:
            test_root = (root_candidate + root_ending).lower()
            if test_root in processed_lemmas:
                found_root = True
                final_root_stem = root_candidate
                break
        
        if found_root and derived_lemma.lower() not in processed_lemmas:
            # Generate the derived entry
            entry_elem = create_entry_element(derived_lemma, final_root_stem, paradigm)
            section.append(entry_elem)
            entries_added += 1
            processed_lemmas.add(derived_lemma.lower())
    
    # Add generic number entry using num_regex paradigm
    num_ord_entry = ET.SubElement(section, 'e')
    ET.SubElement(num_ord_entry, 'i').text = ""
    ET.SubElement(num_ord_entry, 'par').set('n', 'num_ord_regex')

    num_entry = ET.SubElement(section, 'e')
    # Empty lemma + empty i allows regex in paradigm to match surface form
    ET.SubElement(num_entry, 'i').text = ""
    ET.SubElement(num_entry, 'par').set('n', 'num_regex')
    
    # Write output
    print(f"\nWriting monodix to {output_file}...")
    print(f"  Entries added: {entries_added}")
    print(f"  Entries skipped (no paradigm): {entries_skipped_no_paradigm}")
    print(f"  Entries skipped (no lemma): {entries_skipped_no_lemma}")
    print(f"  Entries skipped (junk lemma): {entries_skipped_junk}")
    if ebl_entries_generated > 0:
        print(f"  -ebl adjectives generated from verbs: {ebl_entries_generated}")
    
    
    # Format XML with proper indentation
    indent_xml(root)
    
    tree = ET.ElementTree(root)
    tree.write(output_file, encoding='utf-8', xml_declaration=True)
    
    print(f"✅ Successfully generated monodix: {output_file}")


def indent_xml(elem, level=0):
    """
    Add proper indentation to XML for readability.
    
    CRITICAL: Do NOT add whitespace inside <r> tags because it breaks 
    morphological analysis! Tags like <s n="n"/><s n="pl"/> must be 
    on a single line without newlines or spaces between them.
    """
    indent = "\n" + "  " * level
    
    # Skip formatting inside <r> tags - they must stay on one line
    if elem.tag == 'r':
        # Just fix the tail (what comes after this element)
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent
        return
    
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        for child in elem:
            indent_xml(child, level + 1)
        if not child.tail or not child.tail.strip():
            child.tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent


def main():
    parser = argparse.ArgumentParser(
        description='Generate Apertium monodix from merged JSON'
    )
    parser.add_argument(
        '--input',
        type=Path,
        default=Path(__file__).parent.parent / 'merged' / 'merged_monodix.json',
        help='Input merged_monodix.json file'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path(__file__).parent.parent / 'generated' / 'ido.ido.dix',
        help='Output .dix file'
    )
    parser.add_argument(
        '--min-confidence',
        type=float,
        default=0.0,
        help='Minimum confidence threshold (not used for monodix)'
    )
    
    args = parser.parse_args()
    
    # Create output directory if needed
    args.output.parent.mkdir(parents=True, exist_ok=True)
    
    generate_monodix(args.input, args.output, args.min_confidence)


if __name__ == '__main__':
    main()


