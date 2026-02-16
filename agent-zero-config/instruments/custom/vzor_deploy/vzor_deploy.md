# Problem
Deploy the VZOR frontend by applying patches, validating output, optionally committing to git, and restarting Nginx.

# Solution
Run the deploy script:

```bash
# Deploy frontend with all steps (patch + validate + commit + restart)
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh deploy

# Deploy without git commit
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh deploy --no-commit

# Just apply patches without restart
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh patch

# Validate current index.html
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh validate

# Rollback to previous version
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh rollback

# Show deployment history
bash /a0/instruments/custom/vzor_deploy/vzor_deploy.sh history
```

The deploy process:
1. Creates a backup of current index.html
2. Runs patch_oc.py to generate new index.html from index.html.bak
3. Validates the generated file (non-empty, reasonable size)
4. Optionally commits to git
5. Restarts vzor-nginx Docker container
6. Records the deployment in the database log
