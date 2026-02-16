#!/bin/bash
# VZOR Git Operations Tool
# Usage: bash vzor_git.sh <action> [args]

set -euo pipefail

REPO_DIR="/home/vzor/vzor-app"
ACTION="${1:-help}"
shift || true

cd "$REPO_DIR"

log_to_db() {
    local action="$1"
    local details="$2"
    local status="$3"
    docker exec vzor-postgres psql -U vzor -d vzor_db -c "
        INSERT INTO agent_zero.instrument_executions (instrument_name, action, input_args, output, status)
        VALUES ('vzor_git', '$action', '{}'::jsonb, '$(echo "$details" | head -5 | sed "s/'/''/g")', '$status');
    " 2>/dev/null || true
}

current_branch() {
    git rev-parse --abbrev-ref HEAD
}

case "$ACTION" in
    status)
        echo "📋 Git Status — $(current_branch)"
        echo "-------------------------------------------"
        git status --short
        echo ""
        echo "Branch: $(current_branch)"
        echo "Last commit: $(git log -1 --format='%h %s (%cr)')"
        log_to_db "status" "branch=$(current_branch)" "success"
        ;;

    commit)
        MSG="${1:-}"
        if [ -z "$MSG" ]; then
            echo "❌ Error: Commit message required"
            echo "Usage: vzor_git.sh commit \"feat: description\""
            exit 1
        fi
        echo "📝 Committing on branch: $(current_branch)"
        git add -A
        git commit -m "$MSG"
        echo "✅ Committed: $(git log -1 --format='%h %s')"
        log_to_db "commit" "$MSG" "success"
        ;;

    push)
        BRANCH=$(current_branch)
        echo "🚀 Pushing branch: $BRANCH"

        # Safety: prevent force-push to main
        if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
            echo "⚠️  Pushing to $BRANCH branch. Proceed with caution."
        fi

        git push origin "$BRANCH"
        echo "✅ Pushed $BRANCH to origin"
        log_to_db "push" "branch=$BRANCH" "success"
        ;;

    merge-main)
        BRANCH=$(current_branch)
        if [ "$BRANCH" = "main" ]; then
            echo "❌ Already on main branch, nothing to merge."
            exit 1
        fi
        echo "🔀 Merging main into $BRANCH..."
        git fetch origin main
        git merge origin/main --no-edit
        echo "✅ Merged main into $BRANCH"
        log_to_db "merge-main" "merged main into $BRANCH" "success"
        ;;

    tag)
        TAG_NAME="${1:-}"
        TAG_MSG="${2:-$TAG_NAME}"
        if [ -z "$TAG_NAME" ]; then
            echo "❌ Error: Tag name required"
            echo "Usage: vzor_git.sh tag v1.0.0 \"Release description\""
            exit 1
        fi
        echo "🏷️  Creating tag: $TAG_NAME"
        git tag -a "$TAG_NAME" -m "$TAG_MSG"
        git push origin "$TAG_NAME"
        echo "✅ Tag $TAG_NAME created and pushed"
        log_to_db "tag" "$TAG_NAME: $TAG_MSG" "success"
        ;;

    log)
        echo "📜 Recent Git Log"
        echo "-------------------------------------------"
        git log --oneline --graph --decorate -20
        ;;

    help|*)
        echo "VZOR Git Operations Tool"
        echo "Usage: bash vzor_git.sh <action> [args]"
        echo ""
        echo "Actions:"
        echo "  status               — Show git status and branch info"
        echo "  commit \"message\"     — Stage all and commit with message"
        echo "  push                 — Push current branch to origin"
        echo "  merge-main           — Merge origin/main into current branch"
        echo "  tag <name> [message] — Create and push annotated tag"
        echo "  log                  — Show last 20 commits"
        ;;
esac
