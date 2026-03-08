---
inclusion: always
---

## Dictionary Validation

CRITICAL: Always validate XML dictionary files (`.dix`) against Apertium DTD schema before committing to catch syntax errors early.

**Required Actions:**
- Validate all modified `.dix` files before commit
- Use `xmllint` or Apertium validation tools
- Check for well-formed XML structure
- Verify against Apertium DTD/schema
- Test that dictionary compiles successfully

**Validation Commands:**
```bash
# Validate XML structure
xmllint --noout --dtdvalid /path/to/dix.dtd file.dix

# Compile dictionary to verify
apertium-validate-dictionary file.dix
```

**Common Issues to Check:**
- Unclosed tags
- Invalid attributes
- Incorrect nesting
- Missing required elements
- Character encoding issues
