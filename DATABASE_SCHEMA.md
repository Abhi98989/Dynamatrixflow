# DYNAMATRIX FLOW

## Database Schema & Data Model

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Database:** PostgreSQL\
**ORM:** Prisma\
**Version:** 1.0

## 1. Purpose

This document is the source of truth for the Dynamatrix Flow data model.
The schema must support employee-managed accounts, projects, project
membership, project leads, tasks, subtasks, milestones, task progress,
review workflows, project resources/research links, comments,
notifications, and auditable activity history.

The database must preserve history where business records matter. Avoid
hard-deleting projects, users, tasks, milestones, resources, and
activity records during normal application use.

## 2. Core Relationships

``` text
User
 ├──< ProjectMember >── Project
 │                         ├──< Milestone
 │                         ├──< Task
 │                         │     ├──< Subtask
 │                         │     ├──< TaskUpdate
 │                         │     └──< TaskComment
 │                         ├──< ProjectResource
 │                         └──< ActivityLog
 ├──< Notification
 ├──< Task (assignee)
 └──< ActivityLog (actor)
```

A user can belong to many projects. A project can contain many users.
This many-to-many relationship MUST use `ProjectMember`; never store a
list of employee IDs directly inside `Project`.

## 3. ID Strategy

Use database-generated IDs for relations and separate human-readable
business identifiers.

Examples:

-   Employee: `DMS-001`
-   Project: `DF-EXP-001`
-   Task: `EXP-001`
-   Milestone: `EXP-M01`

Business identifiers must be unique. Never use the sequential employee
ID as the user's password.

## 4. Enums

### SystemRole

``` text
ADMIN
PROJECT_LEAD
EMPLOYEE
```

`PROJECT_LEAD` indicates that a user may act as a lead, but
project-specific authority MUST still be established through the
relevant project membership/lead relation.

### AccountStatus

``` text
ACTIVE
INACTIVE
SUSPENDED
```

### ProjectStatus

``` text
PLANNING
ACTIVE
ON_HOLD
COMPLETED
CANCELLED
ARCHIVED
```

### Priority

``` text
LOW
MEDIUM
HIGH
CRITICAL
```

### TaskStatus

``` text
TODO
IN_PROGRESS
BLOCKED
IN_REVIEW
COMPLETED
CANCELLED
```

### MilestoneStatus

``` text
PLANNED
IN_PROGRESS
COMPLETED
ON_HOLD
```

### ResourceCategory

``` text
RESEARCH
DOCUMENTATION
DEVELOPMENT
DESIGN
API
CLIENT_REFERENCE
COMPETITOR
MEETING
TUTORIAL
OTHER
```

### ProjectMemberRole

``` text
PROJECT_LEAD
DEVELOPER
DESIGNER
QA
RESEARCHER
OTHER
```

### NotificationType

``` text
PROJECT_ASSIGNED
TASK_ASSIGNED
TASK_REASSIGNED
TASK_REVIEW_REQUESTED
TASK_REVIEWED
TASK_DUE_SOON
TASK_OVERDUE
TASK_COMMENT
PROJECT_UPDATE
RESOURCE_ADDED
SYSTEM
```

## 5. User

Represents every person who can sign in.

  -----------------------------------------------------------------------
  Field                   Type                    Rules
  ----------------------- ----------------------- -----------------------
  id                      String                  PK

  employeeId              String                  unique, required

  name                    String                  required

  email                   String?                 unique when present

  passwordHash            String                  required

  systemRole              SystemRole              required

  accountStatus           AccountStatus           default ACTIVE

  position                String?                 e.g. Frontend Developer

  avatarUrl               String?                 optional

  mustChangePassword      Boolean                 default true for newly
                                                  created employees

  lastLoginAt             DateTime?               optional

  passwordChangedAt       DateTime?               optional

  createdById             String?                 self-relation to admin
                                                  creator

  createdAt               DateTime                default now

  updatedAt               DateTime                auto-update

  archivedAt              DateTime?               optional
  -----------------------------------------------------------------------

Rules:

-   Store only a password hash.
-   Temporary passwords must never be persisted in plaintext.
-   `employeeId` is immutable except through a controlled admin
    operation.
-   Inactive/suspended users cannot sign in.
-   Archiving a user must not erase their task/activity history.

Indexes:

-   unique `employeeId`
-   unique `email` where supported/appropriate
-   `accountStatus`
-   `systemRole`

## 6. Project

  Field              Type                  Rules
  ------------------ --------------------- ------------------------------------
  id                 String                PK
  projectCode        String                unique
  name               String                required
  description        Text?                 optional
  clientName         String?               optional
  status             ProjectStatus         required
  priority           Priority              required
  startDate          DateTime?             optional
  deadline           DateTime?             optional
  progressOverride   Int?                  0-100, exceptional manual override
  technologyTags     String\[\]/relation   implementation choice
  internalNotes      Text?                 restricted
  projectLeadId      String?               FK User
  createdById        String                FK User
  createdAt          DateTime              default now
  updatedAt          DateTime              auto-update
  archivedAt         DateTime?             optional

Rules:

-   `projectLeadId` must reference an active user.
-   The lead should also have a `ProjectMember` record with
    `PROJECT_LEAD`.
-   A completed/archived project remains queryable.
-   Default progress is calculated from active tasks, not manually
    typed.

Indexes:

-   unique `projectCode`
-   `status`
-   `priority`
-   `projectLeadId`
-   `deadline`

## 7. ProjectMember

Join table connecting users to projects.

  Field         Type                Rules
  ------------- ------------------- --------------
  id            String              PK
  projectId     String              FK Project
  userId        String              FK User
  projectRole   ProjectMemberRole   required
  joinedAt      DateTime            default now
  removedAt     DateTime?           soft removal
  addedById     String              FK User

Constraints:

-   unique active membership for `(projectId, userId)`
-   a removed member remains in history
-   only authorized users can add/remove members

Indexes:

-   `(projectId, userId)`
-   `userId`
-   `projectRole`

## 8. Milestone

  Field              Type
  ------------------ -----------------
  id                 String
  milestoneCode      String
  projectId          String
  name               String
  description        Text?
  status             MilestoneStatus
  startDate          DateTime?
  deadline           DateTime?
  progressOverride   Int?
  sortOrder          Int
  createdById        String
  createdAt          DateTime
  updatedAt          DateTime
  archivedAt         DateTime?

A milestone belongs to exactly one project. Tasks may optionally
reference a milestone.

## 9. Task

  Field                  Type         Rules
  ---------------------- ------------ ---------------------------------------
  id                     String       PK
  taskCode               String       unique
  projectId              String       required
  milestoneId            String?      optional
  title                  String       required
  description            Text?        optional
  assigneeId             String?      FK User
  createdById            String       FK User
  status                 TaskStatus   default TODO
  priority               Priority     default MEDIUM
  progress               Int          0-100
  startDate              DateTime?    optional
  dueDate                DateTime?    optional
  estimatedMinutes       Int?         optional
  blockerReason          Text?        required when blocked where practical
  submittedForReviewAt   DateTime?    optional
  completedAt            DateTime?    optional
  createdAt              DateTime     default now
  updatedAt              DateTime     auto-update
  archivedAt             DateTime?    optional

Rules:

-   Assignee must be an active member of the project, unless an Admin
    explicitly resolves membership first.
-   `COMPLETED` should normally set progress to 100.
-   Moving out of `COMPLETED` clears/revises `completedAt`.
-   `BLOCKED` should capture a blocker reason.
-   Every important status/assignment/progress change creates a
    `TaskUpdate` and/or `ActivityLog`.

Indexes:

-   unique `taskCode`
-   `projectId`
-   `assigneeId`
-   `status`
-   `priority`
-   `dueDate`
-   composite `(projectId, status)`
-   composite `(assigneeId, status, dueDate)`

## 10. Subtask

  Field         Type
  ------------- -----------
  id            String
  taskId        String
  title         String
  isCompleted   Boolean
  assigneeId    String?
  dueDate       DateTime?
  sortOrder     Int
  completedAt   DateTime?
  createdAt     DateTime
  updatedAt     DateTime

Subtasks are intentionally lighter than full tasks for MVP.

## 11. TaskUpdate

Immutable task history entry.

  Field              Type
  ------------------ -------------
  id                 String
  taskId             String
  userId             String
  previousStatus     TaskStatus?
  newStatus          TaskStatus?
  previousProgress   Int?
  newProgress        Int?
  note               Text?
  blockerReason      Text?
  createdAt          DateTime

Do not edit historical updates except for exceptional administrative
correction.

## 12. TaskComment

  Field       Type
  ----------- -----------
  id          String
  taskId      String
  userId      String
  content     Text
  createdAt   DateTime
  updatedAt   DateTime
  deletedAt   DateTime?

Use soft deletion for comments when audit/history matters.

## 13. ProjectResource

Stores project research, references, documentation, and links.

  Field           Type
  --------------- ---------------------
  id              String
  projectId       String
  relatedTaskId   String?
  title           String
  url             String
  description     Text?
  category        ResourceCategory
  tags            String\[\]/relation
  addedById       String
  createdAt       DateTime
  updatedAt       DateTime
  archivedAt      DateTime?

Rules:

-   Validate `http://` and `https://` URLs.
-   Reject dangerous schemes such as `javascript:`.
-   Project members can add resources according to RBAC.
-   A related task must belong to the same project.
-   Resource deletion should normally archive, not destroy.

Indexes:

-   `projectId`
-   `category`
-   `addedById`
-   `relatedTaskId`

## 14. Notification

  Field        Type
  ------------ ------------------
  id           String
  userId       String
  type         NotificationType
  title        String
  message      String
  entityType   String?
  entityId     String?
  projectId    String?
  isRead       Boolean
  readAt       DateTime?
  createdAt    DateTime

Indexes:

-   composite `(userId, isRead, createdAt)`
-   `projectId`

## 15. ActivityLog

Organization/project audit trail.

  Field        Type
  ------------ ----------
  id           String
  actorId      String?
  projectId    String?
  action       String
  entityType   String
  entityId     String?
  metadata     Json?
  createdAt    DateTime

Never log passwords, temporary passwords, hashes, tokens, cookies, or
secrets.

Recommended action names:

``` text
EMPLOYEE_CREATED
EMPLOYEE_DEACTIVATED
PASSWORD_RESET
PROJECT_CREATED
PROJECT_UPDATED
PROJECT_LEAD_ASSIGNED
PROJECT_MEMBER_ADDED
PROJECT_MEMBER_REMOVED
TASK_CREATED
TASK_ASSIGNED
TASK_REASSIGNED
TASK_STATUS_CHANGED
TASK_PROGRESS_UPDATED
TASK_SUBMITTED_FOR_REVIEW
TASK_REVIEW_CHANGES_REQUESTED
TASK_COMPLETED
RESOURCE_ADDED
RESOURCE_UPDATED
RESOURCE_ARCHIVED
MILESTONE_CREATED
MILESTONE_UPDATED
```

## 16. Sessions / Auth Tables

Use the tables required by the selected Auth.js session strategy.
Session records/tokens must be treated as sensitive. Prefer secure
HTTP-only cookies and server-side authorization checks.

## 17. Delete & Archive Strategy

Hard delete is acceptable only for clearly disposable development/test
data or records with no business history.

Normal production behavior:

-   User → deactivate/archive
-   Project → archive
-   ProjectMember → `removedAt`
-   Task → archive
-   Resource → archive
-   Comment → soft delete
-   ActivityLog → retain
-   TaskUpdate → retain
-   Notification → may be periodically cleaned according to retention
    policy

## 18. Progress Calculation

Default project progress:

``` text
completed non-cancelled tasks / total non-cancelled tasks * 100
```

If there are zero eligible tasks, return `0`, not an error.

Milestone progress can use the same calculation over milestone tasks.

Do not treat task count as employee performance.

## 19. Transactions

Use database transactions for multi-record business actions such as:

-   create employee + audit entry
-   create project + lead membership + audit entry
-   task status update + task update + notifications + activity
-   remove project member + reassign/unassign affected work + activity

## 20. Prisma Implementation Rules

-   Use explicit relations and relation names where ambiguity exists.
-   Use enums for stable controlled states.
-   Add `@@index` based on the query patterns above.
-   Use `@unique` for business identifiers.
-   Keep migrations in source control.
-   Seed only development/demo data.
-   Review destructive migrations before deployment.

## 21. Data Integrity Rules

The server must enforce:

1.  Users cannot access projects they do not belong to unless Admin.
2.  Project Leads can manage only projects they lead unless additional
    permission is granted.
3.  Assignees must belong to the project.
4.  Related resources/tasks must belong to the same project.
5.  Completed tasks have valid completion metadata.
6.  Archived/inactive users cannot receive new work.
7.  Human-readable IDs remain unique.
8.  Sensitive credentials never appear in logs.

This document must be updated before introducing schema behavior that
contradicts these rules.
