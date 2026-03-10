---
inclusion: always
---

## Translation Rule Documentation

Document the reasoning and linguistic basis for complex translation rules using inline comments. Include example word pairs that demonstrate the rule.

**Required Documentation:**
- Linguistic justification for the rule
- Example word pairs showing the transformation
- Edge cases or exceptions
- Source references (grammar books, dictionaries)
- Cross-references to related rules

**Example Format:**
```xml
<!-- 
Rule: Ido -ar verbs → Esperanto -i infinitives
Linguistic basis: Both languages use different infinitive markers
Examples: 
  - irar → iri (to go)
  - manjar → manĝi (to eat)
Exceptions: Irregular verbs handled separately
Reference: Ido Grammar §42, Esperanto Grammar §15
-->
<rule>
  ...
</rule>
```

**Benefits:**
- Maintainability for future contributors
- Understanding linguistic patterns
- Easier debugging and refinement
- Educational value for language learners
