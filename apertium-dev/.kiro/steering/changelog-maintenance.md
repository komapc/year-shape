---
inclusion: always
---

## Changelog Maintenance

CRITICAL: Keep CHANGELOG.md updated with every significant change. Group entries by version and category following Keep a Changelog format.

**Required Format:**
```markdown
## [Version] - YYYY-MM-DD

### Added
- New features, dictionary entries, or capabilities

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes and corrections

### Removed
- Removed features or deprecated functionality
```

**When to Update:**
- Adding new dictionary entries (batch updates acceptable)
- Implementing new translation rules
- Fixing bugs or translation errors
- Changing project structure or APIs
- Updating dependencies or tools
- Removing deprecated features

**Guidelines:**
- Keep entries concise but informative
- Use present tense ("Add support for..." not "Added...")
- Link to issues or PRs when relevant
- Group related changes together
- Mark breaking changes clearly
- Update in the same commit as the change

**Example Entry:**
```markdown
### Added
- Added 150 new Ido verb conjugations to dictionary (#42)
- Implemented rule for handling Ido correlatives → Esperanto (#45)

### Fixed
- Fixed incorrect translation of "kad" → "ĉu" in questions (#48)
```
