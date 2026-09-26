# DYNAMATRIX FLOW

## Routes, Pages & Navigation

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Framework:** Next.js App Router\
**Version:** 1.0

## 1. Route Groups

Recommended application structure:

``` text
src/app/
├── (auth)/
└── (workspace)/
```

Route groups organize code and do not need to appear in the URL.

## 2. Public/Auth Routes

### `/login`

Purpose: Employee ID/password sign-in.

Elements: - Dynamatrix Flow branding - Employee ID - Password - Sign
In - no public registration

Authenticated users should be redirected appropriately.

### `/change-password`

Required when `mustChangePassword=true`.

Elements: - new password - confirm password - password requirements -
Set Password & Continue

Users under forced change should not access the workspace until
complete.

## 3. Workspace Shell

All workspace pages use:

-   dark sidebar
-   topbar
-   breadcrumbs where useful
-   notification bell
-   user menu
-   responsive mobile navigation

## 4. `/dashboard`

Role-aware dashboard.

Admin: - active projects - task attention states - upcoming deadlines -
project progress - workload overview - recent activity

Project Lead: - projects led - review queue - blocked/overdue tasks -
upcoming deadlines - team updates

Employee: - overdue - today - upcoming - in progress - in review -
projects - notifications

## 5. `/projects`

Accessible project list.

Admin sees all projects. Others see only accessible projects.

Features: - search - status filter - priority filter - lead filter where
permitted - create project button for Admin - card/table responsive
layouts

## 6. `/projects/new`

Admin-only project creation page/dialog route.

Fields follow `PROJECT_GUIDE.md`.

## 7. `/projects/[projectId]`

Project Overview.

Show: - name/code/status/priority - lead - dates - progress - task
summary - upcoming work - milestones - recent activity

Project sub-navigation:

``` text
Overview
Tasks
Board
Milestones
Resources
Team
Activity
Settings
```

## 8. `/projects/[projectId]/tasks`

Project task list.

Features: - search - assignee filter - status filter - priority filter -
milestone filter - due-date filter - sorting - New Task for authorized
users

## 9. `/projects/[projectId]/tasks/[taskId]`

Full task detail when a dedicated page is useful.

Show: - task metadata - assignee - status/priority - progress -
description - subtasks - updates - comments - related resources -
activity/review controls

Quick task inspection may also use a side sheet, but the canonical route
must exist.

## 10. `/projects/[projectId]/board`

Kanban board:

``` text
TODO
IN PROGRESS
BLOCKED
IN REVIEW
COMPLETED
```

Drag/drop must call server-authorized status mutations.

## 11. `/projects/[projectId]/milestones`

Milestone list/timeline-lite.

Features: - create/edit for Admin/Lead - status - dates - progress -
linked tasks

No complex Gantt engine in MVP.

## 12. `/projects/[projectId]/resources`

Project Knowledge Hub.

Features: - resource search - categories - tags - added by - related
task - add resource - open/copy external URL

Categories follow database enum.

## 13. `/projects/[projectId]/team`

Project members.

Show: - lead - member role - position - active tasks - joined date -
add/remove controls for authorized users

## 14. `/projects/[projectId]/activity`

Project-scoped activity timeline with pagination.

Filters may include: - entity type - actor - date range

## 15. `/projects/[projectId]/settings`

Admin/Lead according to permissions.

Sections: - project details - status/priority - dates - internal
configuration - archive actions - Admin-only lead reassignment where
applicable

## 16. `/my-tasks`

Current user's tasks.

Tabs/filters:

``` text
All
Today
Upcoming
Overdue
In Progress
In Review
Completed
```

This is a primary employee workflow.

## 17. `/upcoming`

Chronological work view.

Groups:

``` text
Overdue
Today
Tomorrow
Next 7 Days
Later
```

Project Lead/Admin may optionally switch scope according to permissions.

## 18. `/team`

Admin: - all employees - create employee - account status - system
role - position - active projects/tasks

Project Lead: - limited relevant team directory if allowed

Employee: - only permitted directory information, or route may be hidden
depending on final policy

## 19. `/team/[employeeId]`

Internal employee profile.

Admin view: - profile - account status - role - projects - task
workload - password reset action - deactivate action

Non-admin access must be restricted.

## 20. `/notifications`

Current user's notification inbox.

Features: - unread/read - mark all read - pagination - link to related
entity

Never expose another user's notifications.

## 21. `/profile`

Own profile.

Features: - name/profile fields allowed by policy - avatar later -
change password - account information

Employee ID/system role should not be freely editable by employee.

## 22. `/settings`

Application/user settings.

MVP: - personal preferences if needed - Admin organization settings
where appropriate

Do not turn this into an unstructured catch-all page.

## 23. Error Routes

Implement polished:

-   `not-found.tsx`
-   access denied/forbidden state
-   error boundary
-   loading skeletons

Do not reveal whether an inaccessible private project exists when that
would leak information.

## 24. Sidebar Navigation

``` text
DYNAMATRIX FLOW

Dashboard

WORK
Projects
My Tasks
Upcoming

COMPANY
Team

ACTIVITY
Notifications

ACCOUNT
Profile
Settings
```

Hide actions/routes the user cannot use, but still enforce server
authorization.

## 25. Breadcrumb Examples

``` text
Projects / Expo Express
Projects / Expo Express / Tasks
Projects / Expo Express / Tasks / EXP-014
Projects / Expo Express / Resources
Team / DMS-014
```

## 26. URL State

Use search params for shareable filters where useful:

``` text
/projects?status=ACTIVE&priority=HIGH
/my-tasks?status=IN_PROGRESS
/projects/abc/tasks?assignee=xyz&status=BLOCKED
```

Validate all query parameters.

## 27. Mobile Behavior

On mobile:

-   sidebar becomes drawer/sheet;
-   tables become cards where necessary;
-   primary task update controls remain easy to reach;
-   Kanban may scroll horizontally;
-   project sub-navigation can scroll horizontally or use a compact
    menu.

## 28. Route Security Rule

Every protected route must load the current session and validate
authorization before returning private data. Client-side hiding is never
sufficient.
