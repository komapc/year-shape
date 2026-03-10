---
inclusion: always
---

## Pre-Commit Testing

CRITICAL: Always run all tests before committing changes. This ensures no regressions are introduced and the dictionary remains functional.

**Required Actions:**
- Run test suite with `make test` or equivalent command
- Verify all tests pass before `git commit`
- If tests fail, fix issues before committing
- Document any new test requirements in commit message
