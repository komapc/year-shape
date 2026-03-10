# Deployment Guide

This project uses an automated deployment pipeline to ensure that all dictionaries, binaries, and applications are synchronized and verified before being pushed to production.

## 🚀 Automated Deployment

Use the master deployment script located in `core/deploy_all.sh`.

### Usage
```bash
# Run a standard patch deployment (increments x.x.1)
./core/deploy_all.sh patch "Description of changes"

# Run a minor deployment (increments x.1.0)
./core/deploy_all.sh minor "Major feature addition"

# Run a major deployment (increments 1.0.0)
./core/deploy_all.sh major "Initial release"
```

### What it does:
1.  **Regenerates Dictionaries:** Runs `regenerate_all.py` from latest sources.
2.  **Syncs Files:** Copies generated `.dix` files to language pair directories.
3.  **Builds Binaries:** Compiles `.bin` files for all Apertium packages.
4.  **Vortaro Export:** Updates `dictionary.json` for the web app.
5.  **Tests:** Executes `regression_test.py`. **Aborts if tests fail.**
6.  **Versions:** Bumps versions in all `package.json` files.
7.  **Commits & Pushes:** Stages all changes and pushes to current branches in all sub-repos.

---

## 🛠 Manual Workflow (Developers)

If you prefer to run steps manually, follow this order:

1.  Update `core/data/sources/` (JSON files).
2.  Run `cd core/data/scripts && python3 regenerate_all.py`.
3.  Rebuild: `cd apertium-ido && make`.
4.  Verify: `./core/regression_test.py`.

---

## 🪝 Safety Hooks

A `pre-push` hook has been configured in the project root. It will prevent any `git push` command from succeeding if the translation regression tests fail.

To bypass this (not recommended):
`git push --no-verify`
