#!/bin/bash
# Master Deployment Script for Apertium-dev Project
# Orchestrates regeneration, testing, versioning, and pushing.

set -e

BASE_DIR="/home/mark/projects/apertium-dev"
BUMP_TYPE=${1:-patch}
COMMIT_MSG=${2:-"feat: automated dictionary regeneration and morphological fixes"}
BRANCH=$(git branch --show-current)

echo "============================================================"
echo "🚀 STARTING FULL DEPLOYMENT: $BUMP_TYPE"
echo "============================================================"

# 1. Regenerate Dictionaries
echo "▶ STEP 1: Regenerating Dictionaries..."
cd "$BASE_DIR/core/data/scripts"
python3 regenerate_all.py --validate-xml

# 2. Sync Files to Apertium Folders
echo "▶ STEP 2: Syncing Dictionaries..."
cp ../generated/ido.ido.dix "$BASE_DIR/apertium-ido/"
cp ../generated/ido-epo.ido-epo.dix "$BASE_DIR/apertium-ido-epo/"

# 3. Build Apertium Binaries
echo "▶ STEP 3: Rebuilding Apertium Packages..."
cd "$BASE_DIR/apertium-ido" && make
cd "$BASE_DIR/apertium-ido-epo" && make

# 4. Export for Vortaro
echo "▶ STEP 4: Exporting for Vortaro..."
cd "$BASE_DIR/core/data/scripts"
python3 export_vortaro.py
cp ../generated/vortaro_dictionary.json "$BASE_DIR/vortaro/dictionary.json"

# 5. Run Regression Tests
echo "▶ STEP 5: Running Regression Tests..."
cd "$BASE_DIR/core"
if ./regression_test.py | grep -q "FAILED"; then
    echo "❌ ABORTING: Regression tests failed!"
    ./regression_test.py | grep "FAILED"
    exit 1
fi
echo "✅ Tests Passed!"

# 6. Update Versions
echo "▶ STEP 6: Bumping Versions ($BUMP_TYPE)..."
cd "$BASE_DIR/core"
python3 update_versions.py "$BUMP_TYPE"

# 7. Commit and Push
echo "▶ STEP 7: Committing and Pushing Changes..."
repos=("apertium-ido" "apertium-ido-epo" "translator" "vortaro" "extractor")

for repo in "${repos[@]}"; do
    echo "  - Processing $repo..."
    cd "$BASE_DIR/$repo"
    git add .
    # Check if there are changes to commit
    if ! git diff-index --quiet HEAD --; then
        git commit -m "$COMMIT_MSG"
        git push origin "$BRANCH"
        echo "    ✅ Committed and pushed."
    else
        echo "    ⏭ No changes."
    fi
done

# Final Root Commit
cd "$BASE_DIR"
git add .
if ! git diff-index --quiet HEAD --; then
    git commit -m "$COMMIT_MSG"
    git push origin "$BRANCH"
fi

echo "============================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================================"
