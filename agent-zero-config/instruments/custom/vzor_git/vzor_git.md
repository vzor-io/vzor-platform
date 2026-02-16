# Problem
Perform Git operations on the VZOR repository with safety checks and logging.

# Solution
Run the git tool with the desired action:

```bash
# Check status
bash /a0/instruments/custom/vzor_git/vzor_git.sh status

# Commit changes
bash /a0/instruments/custom/vzor_git/vzor_git.sh commit "feat: description of changes"

# Push to remote
bash /a0/instruments/custom/vzor_git/vzor_git.sh push

# Merge main into current branch
bash /a0/instruments/custom/vzor_git/vzor_git.sh merge-main

# Create a tag
bash /a0/instruments/custom/vzor_git/vzor_git.sh tag v1.0.0 "Release description"

# View recent log
bash /a0/instruments/custom/vzor_git/vzor_git.sh log
```

Safety features:
- Prevents force-push to main branch
- Checks for uncommitted changes before operations
- Logs all git operations to the database
- Shows branch info before any destructive operation
