---
inclusion: always
---

## Code Simplicity

CRITICAL: Less code is better than more code. Prioritize simplicity, clarity, and maintainability over complexity.

**Core Principle:**
- Write the minimum code necessary to solve the problem
- Avoid over-engineering and premature optimization
- Simple solutions are easier to understand, test, and maintain

**Guidelines:**

### Prefer Simple Over Complex:
- Use built-in functions and standard libraries instead of custom implementations
- Avoid unnecessary abstractions and layers
- Choose straightforward algorithms over clever but obscure ones
- Delete unused code and dependencies

### DRY (Don't Repeat Yourself):
- Extract common patterns into reusable functions
- Avoid copy-pasting code blocks
- Use parameterization instead of duplication

### Performance Optimization:
- **Precompile regex patterns** when used repeatedly or in loops
- Use `re.compile()` for patterns used multiple times
- Cache compiled patterns as module-level constants
- Avoid compiling the same pattern repeatedly in hot paths

### YAGNI (You Aren't Gonna Need It):
- Don't add functionality until it's actually needed
- Avoid building for hypothetical future requirements
- Remove speculative features and scaffolding

### When More Code Is Justified:
- Clarity: Sometimes explicit code is clearer than terse code
- Error handling: Proper error messages and validation
- Documentation: Comments for complex logic
- Testing: Comprehensive test coverage

**Examples:**

✅ **Good - Simple:**
```python
return max(numbers)
```

❌ **Bad - Overcomplicated:**
```python
max_value = numbers[0]
for num in numbers[1:]:
    if num > max_value:
        max_value = num
return max_value
```

✅ **Good - Minimal:**
```xml
<e><p><l>hundo</l><r>hundo</r></p></e>
```

❌ **Bad - Unnecessary wrapper:**
```xml
<section id="animals">
  <subsection id="mammals">
    <e><p><l>hundo</l><r>hundo</r></p></e>
  </subsection>
</section>
```

**Remember:**
- Code is a liability, not an asset
- Every line of code must be maintained, tested, and understood
- The best code is no code (when it solves the problem)
