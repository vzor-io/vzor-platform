#!/usr/bin/env python3
"""VZOR Task Management Tool — CRUD operations for project tasks in PostgreSQL.
Version 2.0: Multi-project support with clone-template workflow."""

import argparse
import json
import sys
import os
from datetime import datetime

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    os.system("/opt/venv-a0/bin/pip install psycopg2-binary -q")
    import psycopg2
    import psycopg2.extras


TEMPLATE_PROJECT = "_template"


def get_conn():
    return psycopg2.connect(
        host="vzor-postgres",
        port=5432,
        dbname="vzor_db",
        user="vzor",
        password=os.environ.get("POSTGRES_PASSWORD", ""),
    )


# ─── LIST ────────────────────────────────────────────────────────────────────

def list_tasks(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = "SELECT task_id, title, level, status, progress, priority, agent, project FROM agent_zero.tasks WHERE 1=1"
    params = []
    if args.project:
        query += " AND project = %s"
        params.append(args.project)
    else:
        # By default, exclude template
        query += " AND project != %s"
        params.append(TEMPLATE_PROJECT)
    if args.status:
        query += " AND status = %s"
        params.append(args.status)
    if args.phase is not None:
        query += " AND phase = %s"
        params.append(args.phase)
    if args.level is not None:
        query += " AND level = %s"
        params.append(args.level)
    if args.agent:
        query += " AND agent = %s"
        params.append(args.agent)
    if args.all:
        # Override: show everything including template
        query = "SELECT task_id, title, level, status, progress, priority, agent, project FROM agent_zero.tasks WHERE 1=1"
        params = []
    query += " ORDER BY project, task_id"
    cur.execute(query, params)
    rows = cur.fetchall()
    if not rows:
        print("No tasks found.")
        return
    print(f"{'Project':<25} {'Task ID':<15} {'Title':<40} {'Lvl':>3} {'Status':<12} {'Prog':>4} {'Pri':<8}")
    print("-" * 115)
    for r in rows:
        print(f"{(r['project'] or '')[:24]:<25} {r['task_id']:<15} {(r['title'] or '')[:40]:<40} {r['level']:>3} {r['status']:<12} {r['progress']:>3}% {r['priority']:<8}")
    print(f"\nTotal: {len(rows)} task(s)")
    cur.close()
    conn.close()


# ─── SHOW ────────────────────────────────────────────────────────────────────

def show_task(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = "SELECT * FROM agent_zero.tasks WHERE task_id = %s"
    params = [args.task_id]
    if args.project:
        query += " AND project = %s"
        params.append(args.project)
    else:
        query += " AND project != %s"
        params.append(TEMPLATE_PROJECT)
    cur.execute(query, params)
    row = cur.fetchone()
    if not row:
        print(f"Task {args.task_id} not found.")
        return
    print(f"Project: {row['project']}")
    print(f"Task: {row['task_id']}")
    print(f"Title: {row['title']}")
    print(f"Description: {row['description'] or 'N/A'}")
    print(f"Phase: {row['phase']} | Level: {row['level']} | Status: {row['status']}")
    print(f"Progress: {row['progress']}% | Priority: {row['priority']}")
    print(f"Agent: {row['agent'] or 'unassigned'}")
    print(f"Tags: {row['tags']}")
    print(f"Created: {row['created_at']} | Updated: {row['updated_at']}")
    if row['metadata']:
        print(f"Metadata: {json.dumps(row['metadata'], indent=2, default=str)}")
    # Dependencies
    cur.execute("""
        SELECT d.depends_on_task_id, d.dependency_type, t.title, t.status
        FROM agent_zero.task_dependencies d
        JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id AND t.project = d.project
        WHERE d.task_id = %s AND d.project = %s
    """, (args.task_id, row['project']))
    deps = cur.fetchall()
    if deps:
        print("\nDependencies:")
        for d in deps:
            print(f"  {d['dependency_type']}: {d['depends_on_task_id']} — {d['title']} [{d['status']}]")
    cur.close()
    conn.close()


# ─── CREATE ──────────────────────────────────────────────────────────────────

def create_task(args):
    if not args.project:
        print("ERROR: --project is required for create. Example: --project zhk-rechnoy-kazan")
        sys.exit(1)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO agent_zero.tasks (task_id, title, description, phase, level, status, priority, agent, tags, metadata, project)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        args.task_id, args.title, args.description or "",
        args.phase, args.level, args.status or "pending",
        args.priority or "medium", args.agent,
        args.tags.split(",") if args.tags else [],
        json.dumps(json.loads(args.metadata)) if args.metadata else "{}",
        args.project,
    ))
    conn.commit()
    print(f"✅ Task {args.task_id} created in project '{args.project}': {args.title}")
    cur.close()
    conn.close()


# ─── UPDATE ──────────────────────────────────────────────────────────────────

def update_task(args):
    if not args.project:
        print("ERROR: --project is required for update. Example: --project zhk-rechnoy-kazan")
        sys.exit(1)
    conn = get_conn()
    cur = conn.cursor()
    updates = []
    params = []
    if args.status:
        updates.append("status = %s")
        params.append(args.status)
    if args.progress is not None:
        updates.append("progress = %s")
        params.append(args.progress)
    if args.title:
        updates.append("title = %s")
        params.append(args.title)
    if args.agent:
        updates.append("agent = %s")
        params.append(args.agent)
    if args.priority:
        updates.append("priority = %s")
        params.append(args.priority)
    if not updates:
        print("Nothing to update. Specify --status, --progress, --title, --agent, or --priority.")
        return
    updates.append("updated_at = NOW()")
    params.extend([args.task_id, args.project])
    cur.execute(f"UPDATE agent_zero.tasks SET {', '.join(updates)} WHERE task_id = %s AND project = %s", params)
    if cur.rowcount == 0:
        print(f"Task {args.task_id} not found in project '{args.project}'.")
    else:
        conn.commit()
        print(f"✅ Task {args.task_id} updated in project '{args.project}'.")
    cur.close()
    conn.close()


# ─── DEPS ────────────────────────────────────────────────────────────────────

def manage_deps(args):
    if not args.project:
        print("ERROR: --project is required for deps. Example: --project zhk-rechnoy-kazan")
        sys.exit(1)
    conn = get_conn()
    cur = conn.cursor()
    if args.add:
        dep_type = args.type or "blocks"
        cur.execute("""
            INSERT INTO agent_zero.task_dependencies (task_id, depends_on_task_id, dependency_type, project)
            VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING
        """, (args.task_id, args.add, dep_type, args.project))
        conn.commit()
        print(f"✅ Dependency added: {args.task_id} {dep_type} {args.add} (project: {args.project})")
    elif args.remove:
        cur.execute(
            "DELETE FROM agent_zero.task_dependencies WHERE task_id = %s AND depends_on_task_id = %s AND project = %s",
            (args.task_id, args.remove, args.project),
        )
        conn.commit()
        print(f"✅ Dependency removed.")
    else:
        cur.execute("""
            SELECT d.depends_on_task_id, d.dependency_type, t.title, t.status
            FROM agent_zero.task_dependencies d
            JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id AND t.project = d.project
            WHERE d.task_id = %s AND d.project = %s
        """, (args.task_id, args.project))
        rows = cur.fetchall()
        if rows:
            print(f"Dependencies for {args.task_id} (project: {args.project}):")
            for r in rows:
                print(f"  {r[1]}: {r[0]} — {r[2]} [{r[3]}]")
        else:
            print(f"No dependencies for {args.task_id}")
    cur.close()
    conn.close()


# ─── REPORT ──────────────────────────────────────────────────────────────────

def report(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    project_filter = ""
    params = []
    if args.project:
        project_filter = " WHERE project = %s"
        params = [args.project]
    else:
        project_filter = " WHERE project != %s"
        params = [TEMPLATE_PROJECT]

    if args.by_phase:
        cur.execute(f"""
            SELECT phase, status, COUNT(*) as cnt, ROUND(AVG(progress)) as avg_progress
            FROM agent_zero.tasks {project_filter}
            GROUP BY phase, status ORDER BY phase, status
        """, params)
        rows = cur.fetchall()
        print(f"{'Phase':>5} {'Status':<12} {'Count':>5} {'Avg Progress':>12}")
        print("-" * 40)
        for r in rows:
            print(f"{r['phase']:>5} {r['status']:<12} {r['cnt']:>5} {r['avg_progress']:>11}%")

    elif args.by_project:
        cur.execute("""
            SELECT project, COUNT(*) as tasks,
                   SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
                   ROUND(AVG(progress)) as avg_progress
            FROM agent_zero.tasks
            WHERE project != %s
            GROUP BY project ORDER BY project
        """, (TEMPLATE_PROJECT,))
        rows = cur.fetchall()
        if not rows:
            print("No projects found. Use 'clone-template' to create a project.")
            return
        print(f"{'Project':<30} {'Tasks':>6} {'Done':>6} {'Progress':>9}")
        print("-" * 55)
        for r in rows:
            print(f"{r['project']:<30} {r['tasks']:>6} {r['completed']:>6} {r['avg_progress']:>8}%")

    else:
        cur.execute(f"""
            SELECT status, COUNT(*) as cnt, ROUND(AVG(progress)) as avg_progress
            FROM agent_zero.tasks {project_filter}
            GROUP BY status ORDER BY status
        """, params)
        rows = cur.fetchall()
        total = sum(r['cnt'] for r in rows)
        proj_label = args.project or "all projects"
        print(f"📊 VZOR Project Report — {proj_label}")
        print("=" * 40)
        for r in rows:
            pct = round(r['cnt'] / total * 100) if total else 0
            print(f"  {r['status']:<12} {r['cnt']:>4} tasks ({pct}%) — avg progress: {r['avg_progress']}%")
        print(f"\n  Total: {total} tasks")

        # Bottlenecks
        cur.execute(f"""
            SELECT d.depends_on_task_id as task_id, t.title, t.status, COUNT(*) as blocking_count
            FROM agent_zero.task_dependencies d
            JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id AND t.project = d.project
            WHERE t.status != 'completed' {'AND t.project = %s' if args.project else 'AND t.project != %s'}
            GROUP BY d.depends_on_task_id, t.title, t.status
            ORDER BY blocking_count DESC LIMIT 5
        """, (args.project or TEMPLATE_PROJECT,))
        blockers = cur.fetchall()
        if blockers:
            print("\n⚠️  Top Blockers:")
            for b in blockers:
                print(f"  {b['task_id']} [{b['status']}] blocks {b['blocking_count']} task(s): {b['title']}")

    cur.close()
    conn.close()


# ─── CLONE TEMPLATE ──────────────────────────────────────────────────────────

def clone_template(args):
    """Clone all template tasks to a new project."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check if project already has tasks
    cur.execute("SELECT COUNT(*) as cnt FROM agent_zero.tasks WHERE project = %s", (args.project,))
    count = cur.fetchone()['cnt']
    if count > 0:
        if not args.force:
            print(f"Project '{args.project}' already has {count} tasks. Use --force to overwrite.")
            return
        # Delete existing
        cur.execute("DELETE FROM agent_zero.task_dependencies WHERE project = %s", (args.project,))
        cur.execute("DELETE FROM agent_zero.tasks WHERE project = %s", (args.project,))
        print(f"Deleted existing {count} tasks for '{args.project}'.")

    # Copy template tasks
    cur.execute("SELECT * FROM agent_zero.tasks WHERE project = %s ORDER BY task_id", (TEMPLATE_PROJECT,))
    templates = cur.fetchall()

    for t in templates:
        cur.execute("""
            INSERT INTO agent_zero.tasks
                (task_id, title, description, phase, level, status, progress, priority, agent, tags, metadata, parent_task_id, project)
            VALUES (%s, %s, %s, %s, %s, 'pending', 0, %s, NULL, %s, %s, %s, %s)
        """, (
            t['task_id'], t['title'], t['description'],
            t['phase'], t['level'], t['priority'],
            t['tags'], json.dumps(t['metadata'], default=str),
            t['parent_task_id'], args.project,
        ))

    # Copy dependencies
    cur.execute("SELECT * FROM agent_zero.task_dependencies WHERE project = %s", (TEMPLATE_PROJECT,))
    deps = cur.fetchall()
    for d in deps:
        cur.execute("""
            INSERT INTO agent_zero.task_dependencies (task_id, depends_on_task_id, dependency_type, project)
            VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING
        """, (d['task_id'], d['depends_on_task_id'], d['dependency_type'], args.project))

    conn.commit()
    print(f"✅ Cloned {len(templates)} tasks and {len(deps)} dependencies to project '{args.project}'")
    cur.close()
    conn.close()


# ─── DELETE PROJECT ──────────────────────────────────────────────────────────

def delete_project(args):
    if args.project == TEMPLATE_PROJECT:
        print("ERROR: Cannot delete template project.")
        sys.exit(1)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM agent_zero.tasks WHERE project = %s", (args.project,))
    count = cur.fetchone()[0]
    if count == 0:
        print(f"Project '{args.project}' not found.")
        return
    cur.execute("DELETE FROM agent_zero.task_dependencies WHERE project = %s", (args.project,))
    cur.execute("DELETE FROM agent_zero.tasks WHERE project = %s", (args.project,))
    conn.commit()
    print(f"✅ Deleted {count} tasks for project '{args.project}'.")
    cur.close()
    conn.close()


# ─── LIST PROJECTS ───────────────────────────────────────────────────────────

def list_projects(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT project,
               COUNT(*) as tasks,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
               ROUND(AVG(progress)) as avg_progress
        FROM agent_zero.tasks
        GROUP BY project ORDER BY project
    """)
    rows = cur.fetchall()
    if not rows:
        print("No projects found.")
        return
    print(f"{'Project':<30} {'Tasks':>6} {'Done':>6} {'Progress':>9}")
    print("-" * 55)
    for r in rows:
        marker = " (template)" if r['project'] == TEMPLATE_PROJECT else ""
        print(f"{r['project']:<30} {r['tasks']:>6} {r['completed']:>6} {r['avg_progress']:>8}%{marker}")
    cur.close()
    conn.close()


# ─── IMPORT ──────────────────────────────────────────────────────────────────

def import_tasks(args):
    if not args.project:
        print("ERROR: --project is required for import. Example: --project zhk-rechnoy-kazan")
        sys.exit(1)
    with open(args.file, "r") as f:
        data = json.load(f)
    tasks = data.get("tasks", data) if isinstance(data, dict) else data
    conn = get_conn()
    cur = conn.cursor()
    count = 0
    for t in tasks:
        cur.execute("""
            INSERT INTO agent_zero.tasks (task_id, title, description, phase, level, status, progress, priority, agent, tags, metadata, project)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (project, task_id) DO UPDATE SET
                title=EXCLUDED.title, description=EXCLUDED.description,
                status=EXCLUDED.status, progress=EXCLUDED.progress,
                priority=EXCLUDED.priority, agent=EXCLUDED.agent,
                tags=EXCLUDED.tags, metadata=EXCLUDED.metadata
        """, (
            t["task_id"], t["title"], t.get("description", ""),
            t.get("phase", 0), t.get("level", 1),
            t.get("status", "pending"), t.get("progress", 0),
            t.get("priority", "medium"), t.get("agent"),
            t.get("tags", []),
            json.dumps(t.get("metadata", {})),
            args.project,
        ))
        count += 1
        # Handle dependencies
        for dep in t.get("dependencies", []):
            cur.execute("""
                INSERT INTO agent_zero.task_dependencies (task_id, depends_on_task_id, dependency_type, project)
                VALUES (%s, %s, 'blocked_by', %s) ON CONFLICT DO NOTHING
            """, (t["task_id"], dep, args.project))
    conn.commit()
    print(f"✅ Imported {count} task(s) to project '{args.project}'")
    cur.close()
    conn.close()


# ─── EXPORT ──────────────────────────────────────────────────────────────────

def export_tasks(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = "SELECT * FROM agent_zero.tasks"
    params = []
    if args.project:
        query += " WHERE project = %s"
        params = [args.project]
    query += " ORDER BY task_id"
    cur.execute(query, params)
    rows = cur.fetchall()
    tasks = []
    for r in rows:
        task = {
            "task_id": r["task_id"],
            "title": r["title"],
            "description": r["description"],
            "phase": r["phase"],
            "level": r["level"],
            "status": r["status"],
            "progress": r["progress"],
            "priority": r["priority"],
            "agent": r["agent"],
            "tags": r["tags"],
            "metadata": r["metadata"],
            "project": r["project"],
        }
        cur.execute(
            "SELECT depends_on_task_id FROM agent_zero.task_dependencies WHERE task_id = %s AND project = %s",
            (r["task_id"], r["project"]),
        )
        task["dependencies"] = [d["depends_on_task_id"] for d in cur.fetchall()]
        tasks.append(task)
    output = {"tasks": tasks, "project": args.project, "exported_at": datetime.now().isoformat()}
    outfile = args.output or "/tmp/vzor_tasks_export.json"
    with open(outfile, "w") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"✅ Exported {len(tasks)} task(s) to {outfile}")
    cur.close()
    conn.close()


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VZOR Task Management v2.0 (multi-project)")
    sub = parser.add_subparsers(dest="command")

    # list
    p_list = sub.add_parser("list", help="List tasks (filtered by project)")
    p_list.add_argument("--project", help="Project slug (e.g. zhk-rechnoy-kazan)")
    p_list.add_argument("--status", choices=["pending", "in_progress", "completed", "blocked", "cancelled"])
    p_list.add_argument("--phase", type=int)
    p_list.add_argument("--level", type=int)
    p_list.add_argument("--agent")
    p_list.add_argument("--all", action="store_true", help="Show all tasks including template")

    # show
    p_show = sub.add_parser("show", help="Show task details")
    p_show.add_argument("task_id")
    p_show.add_argument("--project", help="Project slug")

    # create
    p_create = sub.add_parser("create", help="Create a task (requires --project)")
    p_create.add_argument("--task-id", required=True)
    p_create.add_argument("--title", required=True)
    p_create.add_argument("--description")
    p_create.add_argument("--phase", type=int, default=0)
    p_create.add_argument("--level", type=int, default=1)
    p_create.add_argument("--status", default="pending")
    p_create.add_argument("--priority", default="medium")
    p_create.add_argument("--agent")
    p_create.add_argument("--tags")
    p_create.add_argument("--metadata")
    p_create.add_argument("--project", required=True, help="Project slug (required)")

    # update
    p_update = sub.add_parser("update", help="Update a task (requires --project)")
    p_update.add_argument("task_id")
    p_update.add_argument("--status")
    p_update.add_argument("--progress", type=int)
    p_update.add_argument("--title")
    p_update.add_argument("--agent")
    p_update.add_argument("--priority")
    p_update.add_argument("--project", required=True, help="Project slug (required)")

    # deps
    p_deps = sub.add_parser("deps", help="Manage dependencies (requires --project)")
    p_deps.add_argument("task_id")
    p_deps.add_argument("--add")
    p_deps.add_argument("--remove")
    p_deps.add_argument("--type", default="blocks")
    p_deps.add_argument("--project", required=True, help="Project slug (required)")

    # report
    p_report = sub.add_parser("report", help="Generate report")
    p_report.add_argument("--project", help="Project slug (optional)")
    p_report.add_argument("--by-phase", action="store_true")
    p_report.add_argument("--by-project", action="store_true")

    # clone-template
    p_clone = sub.add_parser("clone-template", help="Clone template tasks to a new project")
    p_clone.add_argument("--project", required=True, help="Target project slug (e.g. zhk-rechnoy-kazan)")
    p_clone.add_argument("--force", action="store_true", help="Overwrite if project already has tasks")

    # delete-project
    p_del = sub.add_parser("delete-project", help="Delete all tasks for a project")
    p_del.add_argument("--project", required=True, help="Project slug to delete")

    # list-projects
    sub.add_parser("list-projects", help="List all projects with task counts")

    # import
    p_import = sub.add_parser("import", help="Import tasks from JSON (requires --project)")
    p_import.add_argument("file")
    p_import.add_argument("--project", required=True, help="Target project slug")

    # export
    p_export = sub.add_parser("export", help="Export tasks to JSON")
    p_export.add_argument("--output")
    p_export.add_argument("--project", help="Export specific project")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "list": list_tasks,
        "show": show_task,
        "create": create_task,
        "update": update_task,
        "deps": manage_deps,
        "report": report,
        "clone-template": clone_template,
        "delete-project": delete_project,
        "list-projects": list_projects,
        "import": import_tasks,
        "export": export_tasks,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
