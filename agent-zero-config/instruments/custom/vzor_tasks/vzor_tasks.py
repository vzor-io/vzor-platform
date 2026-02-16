#!/usr/bin/env python3
"""VZOR Task Management Tool — CRUD operations for project tasks in PostgreSQL."""

import argparse
import json
import sys
import os
from datetime import datetime

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    os.system("pip install psycopg2-binary")
    import psycopg2
    import psycopg2.extras


def get_conn():
    return psycopg2.connect(
        host="vzor-postgres",
        port=5432,
        dbname="vzor_db",
        user="vzor",
        password=os.environ.get("POSTGRES_PASSWORD", ""),
    )


def list_tasks(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = "SELECT task_id, title, level, status, progress, priority, agent FROM agent_zero.tasks WHERE 1=1"
    params = []
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
    query += " ORDER BY task_id"
    cur.execute(query, params)
    rows = cur.fetchall()
    if not rows:
        print("No tasks found.")
        return
    # Print table
    print(f"{'Task ID':<15} {'Title':<40} {'Lvl':>3} {'Status':<12} {'Prog':>4} {'Pri':<8} {'Agent':<15}")
    print("-" * 110)
    for r in rows:
        print(f"{r['task_id']:<15} {(r['title'] or '')[:40]:<40} {r['level']:>3} {r['status']:<12} {r['progress']:>3}% {r['priority']:<8} {(r['agent'] or ''):<15}")
    print(f"\nTotal: {len(rows)} task(s)")
    cur.close()
    conn.close()


def show_task(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM agent_zero.tasks WHERE task_id = %s", (args.task_id,))
    row = cur.fetchone()
    if not row:
        print(f"Task {args.task_id} not found.")
        return
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
        JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id
        WHERE d.task_id = %s
    """, (args.task_id,))
    deps = cur.fetchall()
    if deps:
        print("\nDependencies:")
        for d in deps:
            print(f"  {d['dependency_type']}: {d['depends_on_task_id']} — {d['title']} [{d['status']}]")
    cur.close()
    conn.close()


def create_task(args):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO agent_zero.tasks (task_id, title, description, phase, level, status, priority, agent, tags, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        args.task_id, args.title, args.description or "",
        args.phase, args.level, args.status or "pending",
        args.priority or "medium", args.agent,
        args.tags.split(",") if args.tags else [],
        json.dumps(json.loads(args.metadata)) if args.metadata else "{}",
    ))
    conn.commit()
    print(f"✅ Task {args.task_id} created: {args.title}")
    cur.close()
    conn.close()


def update_task(args):
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
    params.append(args.task_id)
    cur.execute(f"UPDATE agent_zero.tasks SET {', '.join(updates)} WHERE task_id = %s", params)
    if cur.rowcount == 0:
        print(f"Task {args.task_id} not found.")
    else:
        conn.commit()
        print(f"✅ Task {args.task_id} updated.")
    cur.close()
    conn.close()


def manage_deps(args):
    conn = get_conn()
    cur = conn.cursor()
    if args.add:
        dep_type = args.type or "blocks"
        cur.execute("""
            INSERT INTO agent_zero.task_dependencies (task_id, depends_on_task_id, dependency_type)
            VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
        """, (args.task_id, args.add, dep_type))
        conn.commit()
        print(f"✅ Dependency added: {args.task_id} {dep_type} {args.add}")
    elif args.remove:
        cur.execute("DELETE FROM agent_zero.task_dependencies WHERE task_id = %s AND depends_on_task_id = %s",
                     (args.task_id, args.remove))
        conn.commit()
        print(f"✅ Dependency removed.")
    else:
        cur.execute("""
            SELECT d.depends_on_task_id, d.dependency_type, t.title, t.status
            FROM agent_zero.task_dependencies d
            JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id
            WHERE d.task_id = %s
        """, (args.task_id,))
        rows = cur.fetchall()
        if rows:
            print(f"Dependencies for {args.task_id}:")
            for r in rows:
                print(f"  {r[1]}: {r[0]} — {r[2]} [{r[3]}]")
        else:
            print(f"No dependencies for {args.task_id}")
    cur.close()
    conn.close()


def report(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if args.by_phase:
        cur.execute("""
            SELECT phase, status, COUNT(*) as cnt, ROUND(AVG(progress)) as avg_progress
            FROM agent_zero.tasks
            GROUP BY phase, status ORDER BY phase, status
        """)
        rows = cur.fetchall()
        print(f"{'Phase':>5} {'Status':<12} {'Count':>5} {'Avg Progress':>12}")
        print("-" * 40)
        for r in rows:
            print(f"{r['phase']:>5} {r['status']:<12} {r['cnt']:>5} {r['avg_progress']:>11}%")
    elif args.by_agent:
        cur.execute("""
            SELECT COALESCE(agent, 'unassigned') as agent, status, COUNT(*) as cnt
            FROM agent_zero.tasks
            GROUP BY agent, status ORDER BY agent, status
        """)
        rows = cur.fetchall()
        print(f"{'Agent':<20} {'Status':<12} {'Count':>5}")
        print("-" * 40)
        for r in rows:
            print(f"{r['agent']:<20} {r['status']:<12} {r['cnt']:>5}")
    else:
        # Overall summary
        cur.execute("""
            SELECT status, COUNT(*) as cnt, ROUND(AVG(progress)) as avg_progress
            FROM agent_zero.tasks GROUP BY status ORDER BY status
        """)
        rows = cur.fetchall()
        total = sum(r['cnt'] for r in rows)
        print("📊 VZOR Project Report")
        print("=" * 40)
        for r in rows:
            pct = round(r['cnt'] / total * 100) if total else 0
            print(f"  {r['status']:<12} {r['cnt']:>4} tasks ({pct}%) — avg progress: {r['avg_progress']}%")
        print(f"\n  Total: {total} tasks")

        # Bottlenecks: tasks that block the most others
        cur.execute("""
            SELECT d.depends_on_task_id as task_id, t.title, t.status, COUNT(*) as blocking_count
            FROM agent_zero.task_dependencies d
            JOIN agent_zero.tasks t ON t.task_id = d.depends_on_task_id
            WHERE t.status != 'completed'
            GROUP BY d.depends_on_task_id, t.title, t.status
            ORDER BY blocking_count DESC LIMIT 5
        """)
        blockers = cur.fetchall()
        if blockers:
            print("\n⚠️  Top Blockers:")
            for b in blockers:
                print(f"  {b['task_id']} [{b['status']}] blocks {b['blocking_count']} task(s): {b['title']}")

    cur.close()
    conn.close()


def import_tasks(args):
    with open(args.file, "r") as f:
        data = json.load(f)
    tasks = data.get("tasks", data) if isinstance(data, dict) else data
    conn = get_conn()
    cur = conn.cursor()
    count = 0
    for t in tasks:
        cur.execute("""
            INSERT INTO agent_zero.tasks (task_id, title, description, phase, level, status, progress, priority, agent, tags, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (task_id) DO UPDATE SET
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
        ))
        count += 1
        # Handle dependencies
        for dep in t.get("dependencies", []):
            cur.execute("""
                INSERT INTO agent_zero.task_dependencies (task_id, depends_on_task_id, dependency_type)
                VALUES (%s, %s, 'blocked_by') ON CONFLICT DO NOTHING
            """, (t["task_id"], dep))
    conn.commit()
    print(f"✅ Imported {count} task(s)")
    cur.close()
    conn.close()


def export_tasks(args):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM agent_zero.tasks ORDER BY task_id")
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
        }
        # Get dependencies
        cur.execute("SELECT depends_on_task_id FROM agent_zero.task_dependencies WHERE task_id = %s", (r["task_id"],))
        task["dependencies"] = [d["depends_on_task_id"] for d in cur.fetchall()]
        tasks.append(task)
    output = {"tasks": tasks, "exported_at": datetime.now().isoformat()}
    outfile = args.output or "/tmp/vzor_tasks_export.json"
    with open(outfile, "w") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"✅ Exported {len(tasks)} task(s) to {outfile}")
    cur.close()
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="VZOR Task Management")
    sub = parser.add_subparsers(dest="command")

    # list
    p_list = sub.add_parser("list", help="List tasks")
    p_list.add_argument("--status", choices=["pending", "in_progress", "completed", "blocked", "cancelled"])
    p_list.add_argument("--phase", type=int)
    p_list.add_argument("--level", type=int)
    p_list.add_argument("--agent")

    # show
    p_show = sub.add_parser("show", help="Show task details")
    p_show.add_argument("task_id")

    # create
    p_create = sub.add_parser("create", help="Create a task")
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

    # update
    p_update = sub.add_parser("update", help="Update a task")
    p_update.add_argument("task_id")
    p_update.add_argument("--status")
    p_update.add_argument("--progress", type=int)
    p_update.add_argument("--title")
    p_update.add_argument("--agent")
    p_update.add_argument("--priority")

    # deps
    p_deps = sub.add_parser("deps", help="Manage dependencies")
    p_deps.add_argument("task_id")
    p_deps.add_argument("--add")
    p_deps.add_argument("--remove")
    p_deps.add_argument("--type", default="blocks")

    # report
    p_report = sub.add_parser("report", help="Generate report")
    p_report.add_argument("--by-phase", action="store_true")
    p_report.add_argument("--by-agent", action="store_true")

    # import
    p_import = sub.add_parser("import", help="Import tasks from JSON")
    p_import.add_argument("file")

    # export
    p_export = sub.add_parser("export", help="Export tasks to JSON")
    p_export.add_argument("--output")

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
        "import": import_tasks,
        "export": export_tasks,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
