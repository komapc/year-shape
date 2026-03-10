#!/usr/bin/env python3
"""
Regression testing script for Apertium Ido-Esperanto translation.

This script runs a series of test cases against the local Apertium pipeline
and compares the output to expected translations.
"""

import subprocess
from pathlib import Path
import json

TEST_CASES = {
    "Suffixes": [
        {"ido": "piktisto", "expected": "pentristo"},
        {"ido": "cinem-aktorino", "expected": "kino-aktorino"},
        {"ido": "vilajala", "expected": "vilaĝa"},
        {"ido": "desegnuro", "expected": "desegnaĵo"},
    ],
    "Ordinals": [
        {"ido": "unesma", "expected": "unua"},
        {"ido": "duesma", "expected": "dua"},
        {"ido": "dek-e-sisesma", "expected": "dek-sesa"},
    ],
    "Nationalities": [
        {"ido": "Rusa", "expected": "Rusa"},
        {"ido": "Germana", "expected": "Germana"},
        {"ido": "Kataluniana", "expected": "Kataluna"},
    ],
    "Short Forms & Common Words": [
        {"ido": "esas", "expected": "estas"},
        {"ido": "esis", "expected": "estis"},
        {"ido": "esos", "expected": "estos"},
        {"ido": "es", "expected": "estas"},
        {"ido": "esis Usana fizikisto", "expected": "estis @Usan fizikisto"},
        {"ido": "esas fizikisto", "expected": "estas fizikisto"},
        {"ido": "esos granda", "expected": "estos granda"},
        {"ido": "ja", "expected": "jam"},
        {"ido": "til", "expected": "ĝis"},
        {"ido": "sua", "expected": "sia"},
        {"ido": "to", "expected": "tio"},
        {"ido": "quan", "expected": "kiun"},
        {"ido": "qui", "expected": "kiuj"},
        {"ido": "sud-weste", "expected": "sud-okcidente"},
    ],
}

def translate(text: str) -> str:
    """Run a string through the local Apertium pipeline."""
    apertium_dir = '/home/mark/projects/apertium-dev/apertium/apertium-ido-epo'
    try:
        process = subprocess.run(
            ['apertium', '-d', apertium_dir, 'ido-epo'],
            input=text,
            text=True,
            capture_output=True,
            timeout=10
        )
        if process.returncode != 0:
            return f"ERROR: {process.stderr.strip()}"
        return process.stdout.strip()
    except Exception as e:
        return f"EXCEPTION: {e}"

def run_tests():
    """Runs all test cases and prints the results."""
    results = {}
    total_tests = 0
    total_passed = 0

    for category, cases in TEST_CASES.items():
        category_results = []
        for case in cases:
            total_tests += 1
            translation = translate(case["ido"])
            passed = translation == case["expected"]
            if passed:
                total_passed += 1
            
            category_results.append({
                "ido": case["ido"],
                "expected": case["expected"],
                "actual": translation,
                "passed": passed,
            })
        results[category] = category_results

    # Print results
    # Print results
    print("--- Apertium Regression Test Results ---")
    for category, category_results in results.items():
        print(f"--- {category} ---")
        for res in category_results:
            status = "✅ PASSED" if res["passed"] else "❌ FAILED"
            print(f'{status}: {res["ido"]} -> {res["actual"]} (expected: {res["expected"]})')

    print("--- Summary ---")
    print(f"Passed: {total_passed}/{total_tests}")
    return total_passed == total_tests



if __name__ == "__main__":
    all_passed = run_tests()
    # Exit with a non-zero code if any test fails
    # sys.exit(0 if all_passed else 1)
