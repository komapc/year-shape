---
inclusion: always
---

# Long Task Progress Indication

CRITICAL: Long-running tasks must print progress indications every several seconds to show they are still running and making progress.

**Core Principle:**
- Users need feedback that long tasks are working
- Progress updates prevent confusion about whether a task is stuck
- Show meaningful progress metrics (percentage, items processed, ETA)

**When to Apply:**
- Any task expected to take more than 10 seconds
- File processing with multiple items
- Network operations
- Data extraction/parsing
- Model training
- Large file generation

**Required Progress Updates:**
- Print progress every 3-5 seconds minimum
- Show percentage complete when possible
- Display items processed (e.g., "Processing 1,250/10,000 entries")
- Include ETA when calculable
- Use progress bars for visual feedback

**Implementation Examples:**

```python
# Python with tqdm
from tqdm import tqdm
for item in tqdm(items, desc="Processing"):
    process(item)

# Python manual progress
total = len(items)
for i, item in enumerate(items):
    if i % 100 == 0:  # Every 100 items
        print(f"Progress: {i}/{total} ({i*100//total}%)")
    process(item)
```

```bash
# Bash progress
total=$(wc -l < file.txt)
count=0
while read line; do
    ((count++))
    if ((count % 1000 == 0)); then
        echo "Processed $count/$total lines ($(( count * 100 / total ))%)"
    fi
done < file.txt
```

**What to Show:**
- Current item/step being processed
- Total items/steps
- Percentage complete
- Estimated time remaining (if possible)
- Current speed/rate (items per second)

**Examples:**

✅ **Good:**
```
Parsing Wiktionary dump...
Progress: 1,000/25,000 entries (4%) - ETA: 2m 15s
Progress: 2,000/25,000 entries (8%) - ETA: 2m 05s
Progress: 3,000/25,000 entries (12%) - ETA: 1m 58s
```

❌ **Bad:**
```
Parsing Wiktionary dump...
[no output for 5 minutes]
Done!
```

**Remember:**
- Silent long-running tasks look broken
- Progress updates build confidence
- Users can estimate completion time
- Easier to debug if something goes wrong
