#!/usr/bin/env python3
"""
Translate all phrases from Ido corpus: embedding-aligner/data/raw/ido_corpus.txt
"""

import subprocess
from pathlib import Path
import sys

def translate_sentence(sentence: str, base_dir: Path) -> str:
    """Translate a single sentence using apertium."""
    try:
        cmd = ['apertium', '-d', str(base_dir), 'ido-epo']
        process = subprocess.run(
            cmd,
            input=sentence.strip(),
            text=True,
            capture_output=True,
            timeout=5
        )
        return process.stdout.strip()
    except Exception as e:
        return f"ERROR: {str(e)}"

def main():
    # Paths
    corpus_file = Path('projects/embedding-aligner/data/raw/ido_corpus.txt')
    apertium_dir = Path('apertium/apertium-ido-epo')
    output_file = Path('projects/embedding-aligner/data/raw/ido_corpus_translated.txt')
    
    if not corpus_file.exists():
        print(f"ERROR: Corpus file not found: {corpus_file}")
        sys.exit(1)
    
    print(f"Reading corpus: {corpus_file}")
    print(f"Output: {output_file}")
    print()
    
    # Read corpus
    print("Reading corpus file...")
    with open(corpus_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Filter to actual sentences (skip empty lines, headers, etc.)
    sentences = []
    for line in lines:
        line = line.strip()
        # Skip headers, very short lines, and lines that look like metadata
        if line and not line.startswith('----') and len(line) > 10 and not line.startswith('indexo'):
            sentences.append(line)
    
    print(f"Found {len(sentences)} sentences to translate")
    print(f"Starting translation...\n")
    
    # Translate with progress updates
    results = []
    total = len(sentences)
    for i, sentence in enumerate(sentences, 1):
        if i % 100 == 0 or i == 1:
            print(f"Progress: {i}/{total} ({i/total*100:.1f}%)")
        
        translation = translate_sentence(sentence, apertium_dir)
        results.append((sentence, translation))
    
    # Write results
    print(f"\nWriting results to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Translated Sentences from Ido Corpus\n")
        f.write(f"# Source: {corpus_file}\n")
        f.write(f"# Total sentences: {len(sentences)}\n\n")
        
        for i, (source, translation) in enumerate(results, 1):
            f.write(f"# Sentence {i}\n")
            f.write(f"Ido:   {source}\n")
            f.write(f"Esperanto: {translation}\n")
            f.write("\n")
    
    print(f"✅ Translation complete! Results saved to: {output_file}")
    
    # Summary
    successful = sum(1 for _, trans in results if not trans.startswith('ERROR'))
    with_issues = sum(1 for _, trans in results if '*' in trans or '@' in trans or '#' in trans)
    
    print(f"\nSummary:")
    print(f"  Total: {len(sentences)}")
    print(f"  Successful: {successful}")
    print(f"  With markers: {with_issues}")

if __name__ == '__main__':
    main()
