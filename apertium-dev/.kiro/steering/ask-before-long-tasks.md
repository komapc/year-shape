---
inclusion: always
---

# Ask Before Running Long Tasks

CRITICAL: Before running any task expected to take more than 1 minute, ask the user whether to run it locally or on EC2.

**Core Principle:**
- Long tasks may be better suited for EC2 (faster, doesn't block user's machine)
- User should decide based on their current context
- Provide clear time estimates to help decision-making

**When to Ask:**
- Tasks expected to take > 1 minute
- Large file processing (>100MB)
- Full Wiktionary dump parsing
- Model training
- Bulk data extraction
- Database regeneration

**Required Question Format:**

```
This task will take approximately [TIME ESTIMATE].

Options:
1. Run locally (blocks your terminal, uses your CPU)
2. Run on EC2 (faster, runs in background, requires SSH setup)

Which would you prefer? (1/2)
```

**Time Estimates:**
- Provide realistic estimates based on file sizes
- Mention if task is CPU/memory intensive
- Note if task can be interrupted and resumed

**Examples:**

✅ **Good - Ask first:**
```
About to parse full IO Wiktionary dump (29.8 MB, ~25,000 entries).
Estimated time: 3-5 minutes locally, 1-2 minutes on EC2.

Options:
1. Run locally
2. Run on EC2 (terraform/run_extractor_improved.sh)

Which would you prefer?
```

✅ **Good - Quick task, just run:**
```
Parsing 100 entries for testing (< 10 seconds)...
[runs immediately]
```

❌ **Bad - No warning:**
```
[starts 10-minute task without asking]
```

**EC2 Execution:**
- If user chooses EC2, provide the exact command
- Reference existing EC2 scripts: `terraform/run_extractor_improved.sh`
- Explain how to retrieve results: `terraform/pull_results.sh`

**Local Execution:**
- If user chooses local, run with progress indicators
- Allow Ctrl+C interruption
- Save checkpoints for resumability when possible

**Task Categories:**

**Quick (< 1 min) - Just run:**
- Schema validation
- Small file conversions
- Test runs with --limit
- Single file operations

**Medium (1-5 min) - Ask first:**
- Single Wiktionary dump parsing
- Merge operations
- DIX generation

**Long (> 5 min) - Strongly suggest EC2:**
- Full extraction pipeline
- Multiple dump parsing
- Model training
- Large-scale data processing

**Remember:**
- Respect user's time and resources
- Provide clear options
- Make EC2 execution easy with existing scripts
- Always show progress during execution
