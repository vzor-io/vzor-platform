# Problem
Manage VZOR project tasks: create, list, update, and analyze tasks stored in the PostgreSQL database.

# Solution
Run the task management script:

```bash
# List tasks (with optional filters)
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py list
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py list --status pending --phase 1
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py list --agent developer --level 2

# Show single task details
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py show P1.T2.S3

# Create a task
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py create --task-id P1.T5 --title "New feature" --phase 1 --level 1 --priority high

# Update a task
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py update P1.T2.S3 --status completed --progress 100

# Manage dependencies
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py deps P1.T2.S3 --add P1.T2.S1 --type blocks

# Generate progress report
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py report
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py report --by-phase
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py report --by-agent

# Import tasks from JSON file
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py import tasks.json

# Export tasks to JSON
python3 /a0/instruments/custom/vzor_tasks/vzor_tasks.py export --output tasks_export.json
```
