---
inclusion: always
---

# NEVER PUSH TO MAIN - ABSOLUTE PROHIBITION

**🚨 CRITICAL RULE: NEVER PUSH DIRECTLY TO MAIN/MASTER BRANCH 🚨**

## STOP! Before ANY Git Operation

**BEFORE running ANY git command, you MUST:**

1. **Check current branch:**
   ```bash
   git branch --show-current
   ```

2. **If on main/master:**
   - ❌ **STOP IMMEDIATELY**
   - ❌ **DO NOT PUSH**
   - ❌ **DO NOT COMMIT**
   - ✅ **Create feature branch first**

3. **If not on feature branch:**
   - ❌ **STOP**
   - ✅ **Create feature branch:** `git checkout -b feature/description`

## Absolute Prohibition

❌ **NEVER ALLOWED - NO EXCEPTIONS:**
- `git push origin main`
- `git push origin master`
- `git push` when on main/master branch
- `git commit` when on main/master branch
- `git merge` into main/master
- Any direct modifications to main/master

## Required Workflow - MANDATORY

✅ **ALWAYS FOLLOW THIS EXACT PROCESS:**

### Step 1: Check Branch
```bash
git branch --show-current
# If output is "main" or "master" → STOP and create feature branch
```

### Step 2: Create Feature Branch (if needed)
```bash
git checkout -b feature/descriptive-name
# Examples:
# - feature/add-dictionaries-dialog
# - fix/remove-hardcoded-paths
# - docs/update-deployment-guide
```

### Step 3: Make Changes and Commit
```bash
git add <files>
git commit -m "descriptive message"
```

### Step 4: Push Feature Branch
```bash
git push origin feature/descriptive-name
```

### Step 5: Ask User
**MANDATORY:** Ask user before pushing:
> "I've committed changes to feature/descriptive-name. Ready to push this feature branch?"

### Step 6: Create PR
After pushing, provide PR link:
> "Feature branch pushed. Create PR at: https://github.com/user/repo/pull/new/feature/descriptive-name"

### Step 7: Wait for Approval
**DO NOT MERGE.** User will merge the PR when ready.

## Pre-Push Checklist - MANDATORY

Before EVERY `git push`, verify:

- [ ] Current branch is NOT main/master: `git branch --show-current`
- [ ] Branch name starts with `feature/`, `fix/`, or `docs/`
- [ ] User has given explicit permission to push
- [ ] You have provided the PR link to user

**If ANY checkbox is unchecked → DO NOT PUSH**

## Enforcement Rules

### Rule 1: Always Check Branch First
```bash
# ALWAYS run this before ANY git operation:
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "❌ ERROR: On main/master branch. Create feature branch first."
    exit 1
fi
```

### Rule 2: Never Assume
- ❌ Don't assume you're on the right branch
- ❌ Don't assume user wants changes pushed
- ❌ Don't assume small changes can go to main
- ✅ Always check, always ask, always use feature branches

### Rule 3: Ask Before Every Push
**MANDATORY QUESTION:**
> "I'm about to push to feature/branch-name. Shall I proceed?"

Wait for explicit "yes" before pushing.

## If You Accidentally Push to Main

**IMMEDIATE ACTIONS:**

1. **STOP ALL OPERATIONS**
2. **Acknowledge the mistake:**
   > "❌ ERROR: I accidentally pushed to main. This violates the workflow rules."

3. **Inform user:**
   > "The following commits were pushed to main: [list commits]"

4. **Ask for instructions:**
   > "How would you like to handle this? Options:
   > - Revert the commits
   > - Create a PR retroactively
   > - Force push to undo
   > - Leave as-is and be more careful"

5. **Follow user's instructions exactly**

6. **Update this rule if needed** to prevent future violations

## Why This Rule Exists

- **Code Review:** All changes must be reviewed via PR
- **Quality Control:** Prevents breaking changes from reaching main
- **Collaboration:** Maintains clean git history
- **Best Practices:** Industry standard development workflow
- **Safety:** Protects production/stable branch
- **Accountability:** Clear audit trail of all changes
- **Rollback:** Easy to revert feature branches without affecting main

## No Exceptions - Ever

This rule applies to:
- ✅ All repositories
- ✅ All projects  
- ✅ All changes (documentation, code, configuration, scripts)
- ✅ All situations (urgent fixes, small changes, typos, everything)
- ✅ All users (AI, developers, maintainers, everyone)

**There are NO exceptions. NONE. ZERO. NEVER.**

## Examples

### ❌ WRONG - Direct Push to Main
```bash
git checkout main
git add file.txt
git commit -m "update"
git push origin main  # ❌ VIOLATION
```

### ✅ CORRECT - Feature Branch Workflow
```bash
# 1. Check branch
git branch --show-current  # Output: main

# 2. Create feature branch
git checkout -b feature/update-file

# 3. Make changes
git add file.txt
git commit -m "update file"

# 4. Ask user
# "Ready to push feature/update-file?"

# 5. Push after approval
git push origin feature/update-file

# 6. Provide PR link
# "PR: https://github.com/user/repo/pull/new/feature/update-file"
```

## Verification Script

Before pushing, mentally run this checklist:

```
1. Am I on main/master? → If YES, STOP
2. Am I on a feature branch? → If NO, STOP
3. Did I ask user permission? → If NO, STOP
4. Did user say yes? → If NO, STOP
5. All checks passed? → OK to push
```

## Remember

**Feature branches are for development.**  
**Main is for stable, reviewed code.**  
**NEVER push to main.**  
**NO EXCEPTIONS.**

---

**This rule is absolute and non-negotiable. Violations must be acknowledged and corrected immediately.**