---
inclusion: always
---

## Long-Running Processes

CRITICAL: For any process expected to run more than one minute, provide time estimates, show progress, and implement resumability when possible.

**Required Actions:**

### Before Starting:
- Estimate total runtime based on data size or complexity
- Inform user of expected duration
- Warn if process will take significant time

### During Execution:
- Display progress indicators (percentage, items processed, ETA)
- Show incremental results or milestones
- Use progress bars, counters, or status updates
- Log progress to file for monitoring

### Resumability:
- Implement checkpointing for processes >5 minutes
- Save intermediate state periodically
- Allow process to resume from last checkpoint on failure
- Use lock files to prevent concurrent execution
- Clean up checkpoints after successful completion

**Implementation Examples:**

```bash
# Progress with tqdm or similar
for i in $(seq 1 1000); do
    echo -ne "Processing: $i/1000 ($(($i*100/1000))%)\r"
done

# Checkpoint-based resumability
CHECKPOINT_FILE=".progress_checkpoint"
if [ -f "$CHECKPOINT_FILE" ]; then
    START_FROM=$(cat "$CHECKPOINT_FILE")
else
    START_FROM=0
fi
```

```python
# Python example with progress
from tqdm import tqdm
import pickle

checkpoint_file = '.progress.pkl'

# Load checkpoint if exists
if os.path.exists(checkpoint_file):
    with open(checkpoint_file, 'rb') as f:
        processed_items = pickle.load(f)
else:
    processed_items = []

# Process with progress bar
for item in tqdm(items, desc="Processing", unit="items"):
    process(item)
    processed_items.append(item)
    
    # Save checkpoint every 100 items
    if len(processed_items) % 100 == 0:
        with open(checkpoint_file, 'wb') as f:
            pickle.dump(processed_items, f)
```

**When to Apply:**
- Dictionary compilation (>10,000 entries)
- Bulk testing of translation rules
- Large-scale data processing or imports
- Model training or optimization
- File batch processing

**User Communication:**
- "Starting dictionary compilation... Estimated time: 3-5 minutes"
- "Processing 25,000 entries... Progress: 45% (11,250/25,000) - ETA: 2m 15s"
- "Process interrupted. Progress saved. Run again to resume from item 15,320"
