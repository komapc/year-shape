# Claude Instructions for apertium-gemini

## Project Goal

Build a comprehensive Ido↔Esperanto bilingual dictionary and translation rules for the Apertium machine translation platform.

---

## CRITICAL: No Manual Dictionary Entries

Never manually edit `.dix` files to add word entries. All entries must come from source data via generation scripts.

**Prohibited:**
- Editing `apertium-ido.ido.dix` or `apertium-ido-epo.ido-epo.dix` to add/change word entries

**Required workflow for bidix:**
- Add translation pairs to JSON source files in `projects/data/sources/`
- Run `python3 scripts/regenerate_all.py` to regenerate `apertium-ido-epo.ido-epo.dix`

**Required workflow for monodix:**
- The source of truth for the Ido monodix is `apertium/apertium-ido/apertium-ido.ido.dix`
- Structural changes (paradigm definitions, symbol definitions) may be edited directly

**Exception:** Bug fixes to paradigm logic or structural XML are allowed directly.

---

## CRITICAL: Explicit Actions Only

Do not perform any action unless explicitly requested. When in doubt, ask for clarification.

- Do not edit files without being asked
- Do not run commands unless requested
- Do not commit or push without explicit instruction
- Suggest approaches first, wait for approval before implementing

---

## CRITICAL: Git Workflow

Never push to any branch without explicit user permission.

- Always create a feature branch for changes
- Show the user what will be pushed and wait for approval
- Never merge PRs without user permission
- Never push to `main` or `master` directly

---

## Dictionary Validation

Always validate `.dix` files before committing:

```bash
apertium-validate-dictionary file.dix
lt-comp lr file.dix output.bin
```

---

## Testing

- After any fix to translation rules or dictionaries, test both directions:
  ```bash
  echo "text" | apertium -d . -f none ido-epo
  echo "text" | apertium -d . -f none epo-ido
  ```
- After bug fixes, verify the specific word/sentence that was broken now works.

---

## Changelog

Keep `projects/data/CHANGELOG.md` updated with every significant change using Keep a Changelog format (`Added`, `Changed`, `Fixed`, `Removed`).

---

## Commits

Use conventional commit format:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — restructuring without behavior change
- `docs:` — documentation
- `chore:` — maintenance

Each commit should represent one logical change.

---

## Code Simplicity

Write the minimum code necessary. Avoid over-engineering. Prefer simple, readable solutions over clever ones.

---

## No Secrets in Git

Never commit API keys, tokens, passwords, or credentials. Use environment variables or secrets management.

---

## Sudo Avoidance

Avoid `sudo` whenever possible. Ask the user explicitly before using elevated privileges.
