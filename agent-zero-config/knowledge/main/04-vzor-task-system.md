# VZOR Task System

## Overview
VZOR uses a 3-level hierarchical task system. Tasks are visualized as 3D nodes in the VZOR frontend, connected by dependency edges.

## Hierarchy

### Level 0: Phase
Top-level project phases. Each phase groups related tasks.
- Example: "Phase 1: Core 3D Engine", "Phase 2: Task Data Integration"
- Rendered as large spheres in 3D space

### Level 1: Task
Mid-level work items within a phase.
- Example: "Implement camera controls", "Create API endpoints"
- Rendered as medium spheres, clustered around their parent Phase

### Level 2: Subtask
Granular actionable items within a task.
- Example: "Add orbit camera mode", "Write GET /tasks endpoint"
- Rendered as small spheres, clustered around their parent Task

## Task Properties
| Property | Type | Description |
|----------|------|-------------|
| task_id | string | Unique identifier (format: `P{phase}.T{task}.S{subtask}`) |
| title | string | Human-readable task name |
| description | text | Detailed description of work required |
| phase | integer | Phase number (0-based) |
| level | integer | 0=Phase, 1=Task, 2=Subtask |
| status | enum | `pending`, `in_progress`, `completed`, `blocked`, `cancelled` |
| progress | integer | 0-100 percentage |
| priority | enum | `low`, `medium`, `high`, `critical` |
| agent | string | Assigned agent/person |
| estimated_hours | float | Estimated effort |
| tags | array | Labels for categorization |
| metadata | JSONB | Arbitrary structured data |

## Task ID Format
```
P0.T0.S0  — Phase 0, Task 0, Subtask 0
P1.T3     — Phase 1, Task 3 (no subtask = level 1)
P2        — Phase 2 (no task = level 0)
```

## Dependencies
Tasks can have dependencies on other tasks:
- **blocks**: This task must complete before dependent tasks can start
- **blocked_by**: This task cannot start until prerequisite tasks complete
- **related**: Informational link, no blocking

## vzor-tasks JSON Format
Tasks are stored and exchanged in this JSON format:
```json
{
  "tasks": [
    {
      "task_id": "P1.T2.S3",
      "title": "Implement node hover tooltip",
      "description": "Show task details on mouse hover over 3D node",
      "phase": 1,
      "level": 2,
      "status": "pending",
      "progress": 0,
      "priority": "medium",
      "agent": "developer",
      "estimated_hours": 4,
      "tags": ["frontend", "ui", "three.js"],
      "dependencies": ["P1.T2.S1", "P1.T2.S2"],
      "metadata": {
        "component": "NodeInteraction",
        "file": "frontend/js/interactions.js"
      }
    }
  ]
}
```

## Task Workflow
```
pending → in_progress → completed
   ↓                       ↑
blocked ← (dependency not met)
   ↓
cancelled
```

## Reporting
- **Phase report**: Aggregate progress of all tasks in a phase
- **Agent report**: Tasks assigned to a specific agent, by status
- **Dependency graph**: Visual representation of task dependencies
- **Bottleneck analysis**: Identify tasks that block the most other tasks
