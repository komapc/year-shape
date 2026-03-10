#!/usr/bin/env python3
"""
Helper script to bump versions across all Apertium-dev project components.
"""
import json
import sys
from pathlib import Path

COMPONENTS = [
    "translator/package.json",
    "vortaro/package.json",
]

def bump_version(file_path: Path, part="patch"):
    if not file_path.exists():
        print(f"Skipping {file_path} (not found)")
        return
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    old_version = data.get('version', '1.0.0')
    v_parts = old_version.split('.')
    
    if part == "major":
        v_parts[0] = str(int(v_parts[0]) + 1)
        v_parts[1] = "0"
        v_parts[2] = "0"
    elif part == "minor":
        v_parts[1] = str(int(v_parts[1]) + 1)
        v_parts[2] = "0"
    else: # patch
        v_parts[2] = str(int(v_parts[2]) + 1)
        
    new_version = ".".join(v_parts)
    data['version'] = new_version
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Bumped {file_path.parent.name}: {old_version} -> {new_version}")

if __name__ == "__main__":
    part = sys.argv[1] if len(sys.argv) > 1 else "patch"
    base_dir = Path(__file__).parent.parent
    for comp in COMPONENTS:
        bump_version(base_dir / comp, part)
