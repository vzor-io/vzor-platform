# Problem
Create backups of the VZOR database and agent-zero configuration, with automatic rotation of old backups.

# Solution
Run the backup script with the desired action:

```bash
# Full backup (database + config)
bash /a0/instruments/custom/vzor_backup/vzor_backup.sh full

# Database only
bash /a0/instruments/custom/vzor_backup/vzor_backup.sh db

# Agent Zero config only
bash /a0/instruments/custom/vzor_backup/vzor_backup.sh config

# Rotate old backups (default 30 days)
bash /a0/instruments/custom/vzor_backup/vzor_backup.sh rotate --retention-days 30

# List existing backups
bash /a0/instruments/custom/vzor_backup/vzor_backup.sh list
```

Backups are stored in `/home/vzor/backups/` with timestamp-based filenames. Database backups use pg_dump with compression.
