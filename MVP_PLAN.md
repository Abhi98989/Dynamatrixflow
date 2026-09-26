# DYNAMATRIX FLOW

## MVP Build Plan

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Goal:** Ship a secure, useful internal MVP quickly\
**Version:** 1.0

## Definition of MVP Success

The MVP is successful when Dynamatrix leadership can create employee
accounts and projects, appoint project leads, add members, assign work,
track progress/review, share project resources, and monitor delivery;
employees can securely log in, see upcoming work, update assigned tasks,
and contribute project knowledge.

------------------------------------------------------------------------

## Phase 0 --- Repository & Foundation

-   [x] Create Next.js App Router project with TypeScript
-   [x] Configure pnpm
-   [x] Configure Tailwind CSS
-   [x] Install/configure shadcn/ui
-   [x] Install Lucide React
-   [x] Add design tokens from `UI_GUIDE.md`
-   [x] Configure ESLint/Prettier
-   [x] Create `.env.example`
-   [x] Establish folder structure from `TECH_STACK.md`
-   [x] Create base app shell
-   [x] Add error/loading/not-found foundations

**Exit:** App builds cleanly and design foundation is visible.

------------------------------------------------------------------------

## Phase 1 --- PostgreSQL & Prisma

-   [x] Provision development PostgreSQL
-   [x] Install/configure Prisma
-   [x] Implement enums
-   [x] Implement User
-   [x] Implement Project
-   [x] Implement ProjectMember
-   [x] Implement Milestone
-   [x] Implement Task
-   [x] Implement Subtask
-   [x] Implement TaskUpdate
-   [x] Implement TaskComment
-   [x] Implement ProjectResource
-   [x] Implement Notification
-   [x] Implement ActivityLog
-   [x] Add indexes/constraints
-   [x] Create initial migration
-   [x] Create realistic seed data

**Exit:** Schema matches `DATABASE_SCHEMA.md`; seed runs successfully.

------------------------------------------------------------------------

## Phase 2 --- Authentication & Security

-   [x] Configure Auth.js
-   [x] Employee ID/password login
-   [x] Argon2id password hashing
-   [x] Secure session handling
-   [x] Account status checks
-   [x] Protected workspace
-   [x] `mustChangePassword` guard
-   [x] First-login password change
-   [x] Login rate limiting
-   [x] Session revocation strategy for password reset
-   [x] Central authorization helpers

**Exit:** Users cannot bypass login, forced password change, or
role/project checks.

------------------------------------------------------------------------

## Phase 3 --- Employee Management

-   [x] Admin Team page
-   [x] Add Employee form
-   [x] Generate unique `DMS-###` ID
-   [x] Generate secure temporary password
-   [x] Show temporary credential once
-   [x] Create employee activity event
-   [x] Employee profile
-   [x] Activate/deactivate/suspend
-   [x] Admin password reset
-   [x] Own password change
-   [x] Employee search/filter

**Exit:** Leader can securely create and manage staff accounts.

------------------------------------------------------------------------

## Phase 4 --- Projects & Membership

-   [x] Project list
-   [x] Create project
-   [x] Generate project code
-   [x] Assign Project Lead
-   [x] Add lead membership automatically
-   [x] Add/remove project members
-   [x] Project roles
-   [x] Project overview
-   [x] Edit project
-   [x] Status/priority
-   [x] Archive behavior
-   [x] Project access authorization
-   [x] Project assignment notifications/activity

**Exit:** Projects have a lead and controlled member access.

------------------------------------------------------------------------

## Phase 5 --- Tasks

-   [x] Project task list
-   [x] Create task
-   [x] Generate task code
-   [x] Assign only active project members
-   [x] Priority
-   [x] Status
-   [x] Start/due date
-   [x] Progress
-   [x] Blocker reason
-   [x] Subtasks
-   [x] Reassignment
-   [x] Task detail
-   [x] Task updates/history
-   [x] My Tasks
-   [x] Overdue calculation
-   [x] Upcoming grouping

**Exit:** Employee can see and update assigned work; Lead can organize
project work.

------------------------------------------------------------------------

## Phase 6 --- Review Workflow & Comments

-   [x] Employee submit for review
-   [x] Lead review queue
-   [x] Approve → Completed
-   [x] Request changes → In Progress
-   [x] Review feedback
-   [x] Task comments
-   [x] Review notifications
-   [x] Status transition authorization
-   [x] Reopen completed task with audit reason

**Exit:** Work has a complete assignment → execution → review →
completion cycle.

------------------------------------------------------------------------

## Phase 7 --- Kanban & Milestones

-   [x] Kanban board
-   [x] dnd-kit
-   [x] Server-authorized drag transitions
-   [x] Milestone CRUD
-   [x] Link task to milestone
-   [x] Milestone progress
-   [x] Project progress calculation

**Exit:** Leads can visually organize delivery without a complex Gantt
system.

------------------------------------------------------------------------

## Phase 8 --- Resources / Knowledge Hub

-   [x] Resource list/grid
-   [x] Add resource
-   [x] URL validation
-   [x] Categories
-   [x] Tags
-   [x] Description
-   [x] Related task
-   [x] Search/filter
-   [x] Copy/open URL
-   [x] Edit own resource
-   [x] Lead/Admin management
-   [x] Archive resource
-   [x] Activity log

**Exit:** Each project has a useful shared research/documentation hub.

------------------------------------------------------------------------

## Phase 9 --- Notifications & Activity

-   [x] Notification database service
-   [x] Bell/unread count
-   [x] Notification dropdown
-   [x] Notification page
-   [x] Mark read/all read
-   [x] Project assignment notification
-   [x] Task assignment/reassignment
-   [x] Review notification
-   [x] Due/overdue strategy
-   [x] Project activity timeline
-   [x] Organization activity for Admin
-   [x] Pagination

**Exit:** Important changes are discoverable without real-time
infrastructure.

------------------------------------------------------------------------

## Phase 10 --- Dashboards

### Admin

-   [x] active project count
-   [x] blocked/overdue/review counts
-   [x] project progress
-   [x] upcoming deadlines
-   [x] workload overview
-   [x] recent activity

### Project Lead

-   [x] projects led
-   [x] review queue
-   [x] blocked/overdue
-   [x] upcoming deadlines
-   [x] recent team updates

### Employee

-   [x] overdue
-   [x] today
-   [x] upcoming
-   [x] in progress
-   [x] in review
-   [x] projects
-   [x] notifications

**Exit:** Each role understands what needs attention quickly.

------------------------------------------------------------------------

## Phase 11 --- Search, Filters & Responsive UX

-   [x] project search/filter
-   [x] task search/filter
-   [x] resource search/filter
-   [x] employee search/filter
-   [x] URL-backed filters where useful
-   [x] mobile task cards
-   [x] mobile navigation
-   [x] responsive project tabs
-   [x] responsive resource cards
-   [x] tablet review
-   [x] accessibility pass

**Exit:** Core workflows are usable on desktop and phone.

------------------------------------------------------------------------

## Phase 12 --- Testing & Production Readiness

-   [x] permission unit tests
-   [x] validation tests
-   [x] progress/date utility tests
-   [x] integration tests
-   [x] Playwright critical flow
-   [x] direct URL access tests
-   [x] cross-project isolation tests
-   [x] password/security review
-   [x] production environment configuration
-   [x] database backups
-   [x] migration deployment test
-   [x] `pnpm lint`
-   [x] `pnpm typecheck`
-   [x] tests
-   [x] `pnpm build`
-   [x] staging smoke test
-   [x] production deployment

**Exit:** MVP is safe enough for internal company use.

------------------------------------------------------------------------

## Not in MVP

Do not delay launch for:

-   payroll
-   attendance
-   surveillance
-   CRM
-   accounting
-   client portal
-   full chat
-   video calls
-   AI assistant
-   advanced Gantt
-   microservices
-   Elasticsearch
-   Redis
-   WebSocket server

------------------------------------------------------------------------

## Recommended Agent Workflow

Do NOT ask a coding agent to build the entire system in one prompt.

For each phase:

``` text
1. Read PROJECT_GUIDE.md
2. Read UI_GUIDE.md
3. Read TECH_STACK.md
4. Read DATABASE_SCHEMA.md
5. Read RBAC_PERMISSIONS.md
6. Read WORKFLOWS.md
7. Read ROUTES_AND_PAGES.md
8. Read current MVP_PLAN.md phase
9. Inspect existing code
10. Implement only the selected phase
11. Run lint/typecheck/tests/build as applicable
12. Report files changed, decisions, and remaining checklist
```

Update checkboxes only after the requirement is actually working.

------------------------------------------------------------------------

## Launch Gate

Do not launch until all are true:

-   [x] no public registration
-   [x] temporary passwords are never stored plaintext
-   [x] first login forces password change
-   [x] unauthorized project URLs are blocked server-side
-   [x] employees cannot manage unrelated projects/tasks
-   [x] project leads are scoped to their projects
-   [x] task review workflow works
-   [x] project resources work
-   [x] activity history works
-   [x] production secrets are outside Git
-   [x] database backup exists
-   [x] critical E2E workflow passes
