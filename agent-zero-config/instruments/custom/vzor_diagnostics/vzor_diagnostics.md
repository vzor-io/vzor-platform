# Problem
Check the health and status of all VZOR services, system resources, database connectivity, and recent deployments.

# Solution
Run the diagnostics script to get a full system health report:

```bash
bash /a0/instruments/custom/vzor_diagnostics/vzor_diagnostics.sh
```

The script checks:
- Docker container status for all VZOR services
- CPU, RAM, and disk usage
- PostgreSQL connectivity and database size
- Redis connectivity
- Last deployment from the deployment log
- Nginx access/error log summary
- Recommendations if any issues are detected

Output is a structured report suitable for display to the user.
