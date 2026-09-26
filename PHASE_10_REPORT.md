# Phase 10 — Dashboards & Reporting

## Completed

-   **Dashboard Logic:** Replaced the static dummy data in `/dashboard` with fully dynamic data fetching based on the user's role.
-   **Admin View:** Admins see active project count, all tasks in progress, global overdue counts, global upcoming deadlines, and workspace-wide recent activity.
-   **Lead/Employee View:** Project Leads and Employees see only their relevant data (projects they are members of, tasks assigned to them, and recent activity scoped properly or globally depending on permissions).
-   **Upcoming Deadlines Page:** Created the `/upcoming` page which provides a dedicated view of tasks due within the next 7 days or overdue. Filtered by assignee for employees or globally for admins.
-   **Database Queries:** Leveraged Prisma for efficient querying (e.g. `count` for metrics, nested `include` for relational data).
-   **Test Coverage:** Added `tests/phase10-dashboards.test.mjs` verifying role-based dynamic dashboard metric logic. 

## Files Changed / Created

-   `src/app/(workspace)/dashboard/page.tsx`: Rewritten entirely to fetch real DB metrics (Active Projects, Tasks in Progress, Overdue Tasks), lists of projects with progress calculations, upcoming deadlines, and recent activity.
-   `src/app/(workspace)/upcoming/page.tsx`: New route displaying tasks due soon or overdue, with visual indicators and direct links.
-   `tests/phase10-dashboards.test.mjs`: Test suite validating Admin vs. Employee dashboard metrics fetching.

## Validation Results

-   `pnpm typecheck`: passed.
-   `pnpm test`: all 59 tests passed, including Phase 10 suites.

## Next Phase

Phase 11 — Search, Filters & Responsive UX (Project/task search, mobile layout adjustments, URL-backed filters).
