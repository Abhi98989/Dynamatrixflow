# DYNAMATRIX FLOW

## Technology Stack & Engineering Standards

**Product:** Dynamatrix Flow
**Company:** Dynamatrix Solution
**Document:** `TECH_STACK.md`
**Version:** 1.0

---

# 1. PURPOSE

This document defines the official technology stack for **Dynamatrix Flow**.

Dynamatrix Flow is an internal project, task, employee, resource, and workflow management platform for Dynamatrix Solution.

The main engineering goals are:

* Fast development
* Simple architecture
* Strong security
* Easy deployment
* Good developer experience
* Type safety
* Maintainability
* Scalability
* Responsive UI
* Minimal infrastructure complexity

For the MVP, avoid unnecessary microservices and separate backend applications.

---

# 2. OFFICIAL STACK

Use the following stack.

| Layer                | Technology                 |
| -------------------- | -------------------------- |
| Full-Stack Framework | Next.js                    |
| Runtime              | Node.js                    |
| Language             | TypeScript                 |
| Frontend             | React                      |
| Styling              | Tailwind CSS               |
| Components           | shadcn/ui                  |
| Icons                | Lucide React               |
| Database             | PostgreSQL                 |
| ORM                  | Prisma                     |
| Authentication       | Auth.js                    |
| Validation           | Zod                        |
| Forms                | React Hook Form            |
| Password Hashing     | Argon2                     |
| Drag & Drop          | dnd-kit                    |
| Dates                | date-fns                   |
| Package Manager      | pnpm                       |
| Linting              | ESLint                     |
| Formatting           | Prettier                   |
| Deployment           | Vercel                     |
| Database Hosting     | Managed PostgreSQL         |
| File Storage         | Object storage when needed |

---

# 3. ARCHITECTURE

For the MVP use a **single full-stack Next.js application**.

Architecture:

```text
Browser
   │
   ▼
Next.js
   │
   ├── React UI
   │
   ├── Server Components
   │
   ├── Server Actions
   │
   ├── Route Handlers
   │
   ├── Authentication
   │
   ├── Authorization
   │
   └── Business Logic
            │
            ▼
          Prisma
            │
            ▼
       PostgreSQL
```

Do NOT create separate:

```text
Next.js Frontend
        +
Express Backend
```

for the initial version.

Next.js already provides the Node.js server environment required for the application.

Keeping the application together will reduce:

* Development time
* Deployment complexity
* Authentication complexity
* Duplicate types
* API boilerplate
* CORS configuration
* Infrastructure cost

A separate backend can be introduced later if there is a genuine technical requirement.

---

# 4. FRONTEND FRAMEWORK

## Next.js

Use the latest stable Next.js release compatible with the selected dependencies.

Use:

```text
App Router
```

Do NOT use the legacy Pages Router.

Recommended structure:

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── server/
├── hooks/
├── types/
└── config/
```

---

# 5. REACT

Use React through Next.js.

Prefer:

```text
Server Components
```

by default.

Use Client Components only when required for:

* Forms with client interaction
* Drag and drop
* Dialog interactions
* Dropdown interactions
* Local interactive state
* Browser APIs
* Rich task boards

Do not add `"use client"` to every component.

---

# 6. LANGUAGE

Use:

# TypeScript

Enable strict TypeScript.

Recommended:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Avoid:

```ts
any
```

unless absolutely necessary.

Define proper types for:

* Users
* Employees
* Projects
* Tasks
* Resources
* Milestones
* Notifications
* Permissions
* API responses

---

# 7. NODE.JS

Next.js server functionality runs on Node.js.

Use the current supported LTS version compatible with the selected Next.js release.

Do not rely on experimental Node.js functionality unnecessarily.

Use Node.js for:

* Authentication
* Password hashing
* Database operations
* Server actions
* Route handlers
* Authorization
* Business logic
* Background/server operations where appropriate

---

# 8. PACKAGE MANAGER

Use:

# pnpm

Do not mix package managers.

Use only:

```bash
pnpm
```

Commit:

```text
pnpm-lock.yaml
```

Do not commit:

```text
package-lock.json
yarn.lock
```

when pnpm is the selected package manager.

---

# 9. DATABASE

Use:

# PostgreSQL

PostgreSQL is the primary application database.

It is suitable for the strongly related data in Dynamatrix Flow:

```text
Users
   ↓
Project Memberships
   ↓
Projects
   ↓
Tasks
   ↓
Subtasks

Projects
   ↓
Milestones

Projects
   ↓
Resources

Tasks
   ↓
Comments

Users
   ↓
Notifications

Everything
   ↓
Activity Logs
```

Do NOT use MongoDB for the MVP.

---

# 10. ORM

Use:

# Prisma ORM

Prisma should manage:

* Database schema
* Migrations
* Relations
* Queries
* Type-safe database access

Main schema:

```text
prisma/schema.prisma
```

Development seed:

```text
prisma/seed.ts
```

Use migrations properly.

Do not manually modify production database tables outside the migration process unless there is an emergency and the change is documented.

---

# 11. CORE DATABASE MODELS

The Prisma schema should include models similar to:

```text
User
Project
ProjectMember
Milestone
Task
Subtask
TaskUpdate
TaskComment
ProjectResource
Notification
ActivityLog
Session
```

Additional models may be introduced where justified.

---

# 12. DATABASE IDENTIFIERS

Use internal database IDs separately from human-readable IDs.

Example internal ID:

```text
cmxyz...
```

Employee ID:

```text
DMS-001
```

Project code:

```text
DF-EXP-001
```

Task code:

```text
EXP-142
```

Never expose database design unnecessarily through user-facing identifiers.

---

# 13. AUTHENTICATION

Use:

# Auth.js

Authentication should use credentials for the MVP.

Login:

```text
Employee ID
Password
```

No public registration.

Employee accounts are created by authorized company leadership/admin users.

Authentication flow:

```text
Admin
   ↓
Creates Employee
   ↓
Employee ID generated
   ↓
Temporary Password generated
   ↓
Password hashed
   ↓
Employee logs in
   ↓
Forced Password Change
   ↓
Normal Access
```

---

# 14. PASSWORD HASHING

Use:

# Argon2

Prefer:

```text
Argon2id
```

Passwords must NEVER be stored as plain text.

Store only password hashes.

The temporary password may be shown to the administrator immediately after account creation.

Do not provide an API that retrieves the original password later.

If the employee loses their password:

```text
Admin resets password
        ↓
New temporary password
        ↓
Employee logs in
        ↓
Forced password change
```

---

# 15. AUTHORIZATION

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
Are you allowed to do this?
```

Both are required.

Roles:

```text
ADMIN
PROJECT_LEAD
EMPLOYEE
```

Do not depend only on role.

Project membership must also be checked.

Example:

```text
EMPLOYEE
+
Member of Project A
```

does NOT automatically mean:

```text
Can access Project B
```

---

# 16. AUTHORIZATION LAYER

Create centralized permission helpers.

Suggested:

```text
src/server/auth/
├── permissions.ts
├── require-user.ts
├── require-admin.ts
├── project-access.ts
└── task-access.ts
```

Examples:

```ts
canViewProject()
canManageProject()
canCreateTask()
canAssignTask()
canUpdateTask()
canReviewTask()
canManageMembers()
canManageResources()
```

Do not scatter permission logic randomly across UI components.

---

# 17. VALIDATION

Use:

# Zod

All external/user-controlled input must be validated.

Examples:

```text
Create Employee
Create Project
Update Project
Create Task
Update Task
Create Resource
Create Comment
Password Change
```

Create reusable schemas.

Suggested:

```text
src/lib/validations/
```

or feature-specific validation files.

---

# 18. FORMS

Use:

# React Hook Form

with:

# Zod

Typical flow:

```text
React Hook Form
      ↓
Zod Validation
      ↓
Server Action / Route Handler
      ↓
Authorization
      ↓
Server Validation
      ↓
Database
```

Client-side validation improves UX.

Server-side validation is mandatory.

Never trust client-side validation alone.

---

# 19. UI COMPONENT SYSTEM

Use:

# shadcn/ui

Primary components:

```text
Button
Input
Textarea
Select
Dialog
Sheet
Dropdown Menu
Popover
Tooltip
Avatar
Badge
Table
Tabs
Command
Calendar
Alert Dialog
Skeleton
```

Customize components according to:

```text
UI_GUIDE.md
```

Do not leave the product looking like an untouched shadcn demo.

---

# 20. STYLING

Use:

# Tailwind CSS

Follow the design tokens established in:

```text
UI_GUIDE.md
```

Do not introduce random colors such as:

```text
blue-500
purple-400
green-600
```

throughout individual pages without design-system reasoning.

Use semantic tokens such as:

```text
primary
background
surface
border
success
warning
danger
info
```

where practical.

---

# 21. ICONS

Use:

# Lucide React

Example:

```ts
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  Search,
  Settings,
  Library,
  Plus,
  ExternalLink,
} from "lucide-react";
```

Do not mix:

```text
FontAwesome
Material Icons
Heroicons
Lucide
```

in the same interface.

Lucide is the official icon library for Dynamatrix Flow.

---

# 22. DRAG AND DROP

Use:

# dnd-kit

Primary use:

```text
Kanban Board
```

Example:

```text
TO DO
   ↓
IN PROGRESS
   ↓
IN REVIEW
   ↓
COMPLETED
```

Dragging a task must still trigger server-side authorization.

Never assume that because the UI allowed a drag, the server should accept the status change.

---

# 23. DATE MANAGEMENT

Use:

# date-fns

Use it for:

* Formatting dates
* Relative dates
* Deadline calculations
* Upcoming tasks
* Overdue detection

Store timestamps consistently.

Prefer database timestamps in UTC.

Display dates/times according to the application's configured timezone.

For Dynamatrix Solution, the initial organization timezone can be configured as:

```text
Asia/Kathmandu
```

Do not hard-code timezone conversion throughout components.

Keep organization timezone configuration centralized.

---

# 24. DATA FETCHING

Prefer server-side data access where appropriate.

Example:

```text
Server Component
       ↓
Service
       ↓
Prisma
       ↓
PostgreSQL
```

Do not automatically create REST endpoints for every database operation.

Use:

* Server Components
* Server Actions
* Route Handlers

according to the use case.

---

# 25. SERVER ACTIONS

Server Actions can be used for authenticated application mutations such as:

```text
Create Project
Create Task
Update Task
Add Project Member
Add Resource
Create Comment
Mark Notification Read
```

Every Server Action must:

1. Authenticate the user.
2. Validate input.
3. Check authorization.
4. Perform the operation.
5. Handle expected errors.
6. Revalidate/update affected UI.

Never assume Server Actions are automatically secure.

---

# 26. ROUTE HANDLERS

Use Route Handlers where an HTTP endpoint is genuinely useful.

Examples:

```text
/api/auth/*
/api/uploads/*
/api/integrations/*
/api/webhooks/*
```

Do not build unnecessary internal APIs just because traditional frontend/backend projects use them.

---

# 27. SERVICE LAYER

Keep significant business logic outside React components.

Suggested:

```text
src/server/services/
├── employee.service.ts
├── project.service.ts
├── task.service.ts
├── resource.service.ts
├── notification.service.ts
└── activity.service.ts
```

Responsibilities:

```text
UI
 ↓
Action / Handler
 ↓
Authorization
 ↓
Service
 ↓
Prisma
 ↓
Database
```

Keep complex business rules in services.

---

# 28. ACTIVITY LOGGING

Create a centralized activity service.

Example:

```ts
logActivity({
  actorId,
  projectId,
  action,
  entityType,
  entityId,
  metadata,
});
```

Use for important actions such as:

```text
PROJECT_CREATED
PROJECT_UPDATED

MEMBER_ADDED
MEMBER_REMOVED

TASK_CREATED
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_COMPLETED

RESOURCE_ADDED
RESOURCE_UPDATED

MILESTONE_CREATED
```

Do not log sensitive values such as passwords.

---

# 29. NOTIFICATIONS

For MVP, start with:

# Database-backed in-app notifications

Do NOT immediately add complex real-time infrastructure.

Notification model:

```text
Notification

id
userId
type
title
message
entityType
entityId
isRead
createdAt
```

UI:

```text
Bell
 ↓
Unread Count
 ↓
Notification Dropdown
 ↓
Notifications Page
```

---

# 30. REAL-TIME FEATURES

Real-time WebSockets are NOT required for MVP.

Start with:

* Server revalidation
* Refresh/re-fetch where appropriate
* Database notifications

If true real-time collaboration becomes necessary later, evaluate:

```text
SSE
WebSockets
Managed real-time service
```

Do not increase MVP complexity unnecessarily.

---

# 31. PROJECT RESOURCES

Project resources are primarily links and metadata.

Store:

```text
title
url
description
category
tags
projectId
relatedTaskId
addedById
createdAt
updatedAt
```

Do NOT download and duplicate every linked website/resource.

Store the URL and project-specific metadata.

Validate URLs before saving.

---

# 32. FILE ATTACHMENTS

File uploads are optional for the first MVP.

When implemented, do NOT store large files directly inside PostgreSQL.

Architecture:

```text
Browser
   ↓
Upload
   ↓
Object Storage
   ↓
File URL / Key
   ↓
PostgreSQL metadata
```

Potential uses:

```text
Task attachments
Project documents
Screenshots
Reference files
Employee avatars
```

Keep the storage provider abstracted so it can be changed later.

---

# 33. SEARCH

Start with PostgreSQL-backed search/filtering.

For MVP, support searching:

```text
Projects
Tasks
Employees
Resources
```

Do NOT introduce Elasticsearch/Algolia solely for the initial internal application.

PostgreSQL is sufficient initially.

---

# 34. FILTERS

Perform important filtering server-side when data volume can grow.

Examples:

```text
?status=IN_PROGRESS
?priority=HIGH
?project=...
?assignee=...
```

Preserve useful filters in URL search parameters where appropriate.

This makes views shareable and browser navigation predictable.

---

# 35. STATE MANAGEMENT

Do NOT introduce Redux by default.

Prefer:

```text
Server state → Next.js/server data
URL state → searchParams
Form state → React Hook Form
Small UI state → useState
Shared UI state → React Context where justified
```

Only introduce a dedicated state library if a real requirement appears.

---

# 36. DATA TABLES

Use shadcn-compatible table components.

If advanced table functionality is needed, use:

# TanStack Table

Use for:

```text
Sorting
Filtering
Column visibility
Pagination
Selection
```

Avoid implementing a complex table engine manually.

---

# 37. ENVIRONMENT VARIABLES

Use:

```text
.env.local
```

for local development.

Example variables:

```env
DATABASE_URL=

AUTH_SECRET=

APP_URL=

NEXT_PUBLIC_APP_NAME="Dynamatrix Flow"
```

Later, storage/integration variables may include:

```env
STORAGE_...
EMAIL_...
```

Never commit production `.env` files.

Provide:

```text
.env.example
```

containing variable names without secrets.

---

# 38. PROJECT DIRECTORY

Recommended structure:

```text
dynamatrix-flow/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   ├── logos/
│   └── images/
│
├── src/
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── change-password/
│   │   │
│   │   ├── (workspace)/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── my-tasks/
│   │   │   ├── upcoming/
│   │   │   ├── team/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   │
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── shared/
│   │   └── forms/
│   │
│   ├── features/
│   │   ├── employees/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── milestones/
│   │   ├── resources/
│   │   ├── notifications/
│   │   └── activity/
│   │
│   ├── server/
│   │   ├── auth/
│   │   ├── services/
│   │   └── db/
│   │
│   ├── lib/
│   │   ├── validations/
│   │   ├── utils/
│   │   └── constants/
│   │
│   ├── hooks/
│   ├── types/
│   └── config/
│
├── .env.example
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
│
├── README.md
├── PROJECT_GUIDE.md
├── UI_GUIDE.md
└── TECH_STACK.md
```

Do not treat this structure as permission to create unnecessary abstraction.

Keep related code close together.

---

# 39. FEATURE ORGANIZATION

Complex features can contain:

```text
features/tasks/
├── components/
├── actions/
├── schemas/
├── queries/
├── types/
└── utils/
```

For example:

```text
features/tasks/
├── components/
│   ├── task-card.tsx
│   ├── task-table.tsx
│   ├── task-board.tsx
│   └── task-form.tsx
│
├── actions/
│   ├── create-task.ts
│   └── update-task.ts
│
└── schemas/
    └── task.schema.ts
```

Do not create folders containing only one meaningless wrapper file.

---

# 40. NAMING CONVENTIONS

Files:

```text
create-task.ts
task-card.tsx
project-overview.tsx
employee-form.tsx
```

React components:

```text
TaskCard
ProjectOverview
EmployeeForm
```

Functions:

```text
createTask()
updateTask()
getProject()
```

Database models:

```text
User
Project
ProjectMember
Task
ProjectResource
```

Constants/enums:

```text
ADMIN
PROJECT_LEAD
IN_PROGRESS
CRITICAL
```

Keep naming consistent.

---

# 41. ERROR HANDLING

Never show raw database/server errors to end users.

Server:

```text
Log useful technical information
```

Client:

```text
Show understandable message
```

Example:

Bad:

```text
PrismaClientKnownRequestError P2002...
```

Good:

```text
An employee with this ID already exists.
```

---

# 42. LOGGING

For initial development, structured server logging is sufficient.

Log:

```text
Unexpected server errors
Authentication failures where appropriate
Important integration failures
Background job failures
```

Do NOT log:

```text
Passwords
Temporary passwords
Auth tokens
Session secrets
Sensitive credentials
```

---

# 43. SECURITY BASELINE

Implement:

* Argon2id password hashing
* Secure session handling
* HTTP-only cookies
* Secure cookies in production
* SameSite protection
* Login rate limiting
* Zod validation
* Server-side authorization
* Project membership checks
* Environment secrets
* Secure headers
* Safe URL validation
* Database constraints

Never rely on hidden buttons for authorization.

Example:

An employee may manually attempt:

```text
/projects/another-project
```

The SERVER must reject access.

---

# 44. RATE LIMITING

At minimum rate limit:

```text
Login attempts
Password reset attempts
Sensitive authentication operations
```

A managed rate limiter can be introduced during deployment if required.

---

# 45. DATABASE INDEXES

Add indexes for commonly queried fields.

Examples:

```text
User.employeeId

Project.status
Project.projectLeadId

ProjectMember.projectId
ProjectMember.userId

Task.projectId
Task.assigneeId
Task.status
Task.dueDate

Notification.userId
Notification.isRead

ActivityLog.projectId
ActivityLog.createdAt

ProjectResource.projectId
ProjectResource.category
```

Use composite indexes where query patterns justify them.

---

# 46. PAGINATION

Do not load unlimited records.

Use pagination for:

```text
Activity logs
Notifications
Large task lists
Resources
Projects when necessary
```

Cursor-based pagination is preferred for continuously growing feeds such as activity logs.

Simple page-based pagination is acceptable for management tables.

---

# 47. DATABASE TRANSACTIONS

Use transactions when multiple related changes must succeed together.

Example:

```text
Create Employee
+
Create Employee Profile
+
Create Activity Entry
```

or:

```text
Update Task
+
Create Task Update
+
Create Notification
+
Create Activity Log
```

Prevent partial state.

---

# 48. TESTING

Use a practical testing strategy.

## Unit Tests

Test:

```text
Permission logic
Progress calculations
Date/deadline utilities
Validation
Business rules
```

## Integration Tests

Test:

```text
Authentication
Project creation
Employee creation
Project membership
Task assignment
Task status changes
Resource creation
```

## End-to-End Tests

Recommended:

# Playwright

Critical flows:

```text
Admin Login
     ↓
Create Employee
     ↓
Create Project
     ↓
Assign Lead
     ↓
Add Employee
     ↓
Create Task
     ↓
Employee Login
     ↓
Update Task
     ↓
Lead Review
```

---

# 49. CODE QUALITY

Use:

```text
ESLint
Prettier
TypeScript strict mode
```

Before merging/deploying:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add scripts where necessary.

No production deployment should depend on code that fails TypeScript checks.

---

# 50. GIT WORKFLOW

Recommended branches:

```text
main
develop
feature/*
fix/*
```

Examples:

```text
feature/employee-management
feature/project-resources
feature/task-board
fix/task-permissions
```

Use meaningful commits.

Example:

```text
feat(tasks): add task assignment workflow

fix(auth): enforce password change after first login

feat(resources): add project resource categories
```

---

# 51. DEPLOYMENT

Recommended MVP deployment:

```text
GitHub
   ↓
Vercel
   ↓
Next.js Application
   ↓
Managed PostgreSQL
```

Keep deployment simple.

Configure separate:

```text
Development
Preview/Staging
Production
```

environments when possible.

---

# 52. DATABASE HOSTING

Use a reputable managed PostgreSQL provider.

The application should depend on standard PostgreSQL rather than provider-specific database behavior wherever possible.

This makes future migration easier.

Ensure:

* Automated backups
* Secure connection
* Production credentials
* Appropriate connection pooling
* Region selected appropriately for the team

---

# 53. DEPLOYMENT ENVIRONMENTS

Recommended:

```text
LOCAL
   ↓
DEVELOPMENT

Git Branch / PR
   ↓
PREVIEW

main
   ↓
PRODUCTION
```

Never test destructive database migrations directly against production first.

---

# 54. DATABASE MIGRATIONS

Development:

```bash
pnpm prisma migrate dev
```

Production deployment should use the appropriate Prisma production migration command.

Never use schema force/reset operations against production data.

Always review migrations that:

```text
Drop tables
Drop columns
Change required fields
Change relations
```

---

# 55. SEEDING

Development seed should create:

```text
1 Admin

3–5 Employees

2 Projects

Project memberships

Milestones

10–20 Tasks

Several Resources

Notifications

Activity entries
```

This allows the interface to be tested realistically.

Do not seed production with development credentials.

---

# 56. PERFORMANCE

Optimize intentionally rather than prematurely.

Use:

* Server Components
* Database indexes
* Pagination
* Select only required database fields
* Avoid N+1 database queries
* Lazy-load heavy interactive features
* Next.js image optimization where appropriate

Do not add Redis simply because caching exists.

Add infrastructure only when measurements demonstrate a need.

---

# 57. ACCESSIBILITY

Technical implementation must follow the requirements in:

```text
UI_GUIDE.md
```

Use:

* Semantic HTML
* Keyboard navigation
* Focus states
* Proper form labels
* Accessible dialogs
* Accessible dropdowns
* ARIA only when needed

shadcn/Radix primitives can provide a good accessibility foundation.

---

# 58. RESPONSIVE DEVELOPMENT

Breakpoints should follow Tailwind conventions unless the design requires otherwise.

Develop primarily for:

```text
Desktop
Tablet
Mobile
```

Employee workflows must be usable on mobile.

Do not make mobile an afterthought.

---

# 59. BROWSER SUPPORT

Prioritize current versions of:

```text
Chrome
Edge
Firefox
Safari
```

Do not spend MVP development time supporting obsolete browsers.

---

# 60. EXTERNAL LINKS

Project Resources may contain external URLs.

When opening external resources:

```text
target="_blank"
rel="noopener noreferrer"
```

Validate allowed URL protocols.

Allow:

```text
https://
http://
```

where necessary.

Reject dangerous protocols such as:

```text
javascript:
data:
```

unless there is a specific safe use case.

---

# 61. EMAIL

Email infrastructure is NOT required for the first working version.

Initial notifications are in-app.

Later email can support:

```text
Account invitation
Password reset
Task assignment
Deadline reminders
Project updates
```

Keep notification logic separated from delivery providers so email can be added later.

---

# 62. FUTURE REAL-TIME ARCHITECTURE

Do not build this initially.

If required later:

```text
Database
    ↓
Application Event
    ↓
Realtime Layer
    ↓
Connected Users
```

Potential uses:

```text
Live notifications
Live task status
Live comments
Presence
```

Design the application so this can be introduced without replacing the entire task system.

---

# 63. FUTURE BACKGROUND JOBS

Some future operations may require jobs:

```text
Deadline reminders
Daily summaries
Email notifications
Report generation
Data cleanup
```

Do not create a complex queue system until these requirements exist.

---

# 64. FUTURE FILE STORAGE

When file uploads become necessary, add an object-storage provider.

Keep database records such as:

```text
FileAttachment

id
name
storageKey
mimeType
size
uploadedById
projectId
taskId
createdAt
```

The database stores metadata.

Object storage stores file bytes.

---

# 65. FUTURE API

If Dynamatrix Flow later requires:

```text
Mobile application
Third-party integrations
Client portal
External automation
Public API
```

then introduce a clearly versioned API:

```text
/api/v1/
```

Do not create this complexity before it is required.

---

# 66. FUTURE AI

AI is NOT part of the initial MVP.

Future possibilities:

```text
Project summaries
Task summaries
Weekly reports
Research summarization
Risk identification
Search assistant
```

Keep business data structured enough that AI features can later consume it safely.

---

# 67. TECHNOLOGIES NOT REQUIRED FOR MVP

Do NOT add these without a clear reason:

```text
Redux
GraphQL
Docker Kubernetes
Kafka
RabbitMQ
Elasticsearch
Redis
Microservices
Separate Express API
WebSocket server
Complex event architecture
Multiple databases
```

The objective is not to maximize the number of technologies.

The objective is to ship a reliable internal system quickly.

---

# 68. MVP STACK SUMMARY

The official Dynamatrix Flow MVP stack is:

```text
┌─────────────────────────────────────┐
│             USER                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│             NEXT.JS                 │
│                                     │
│ React                               │
│ TypeScript                          │
│ Server Components                   │
│ Server Actions                      │
│ Route Handlers                      │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐     ┌───────────────┐
│   Auth.js    │     │ Business      │
│              │     │ Logic         │
└──────────────┘     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │    Prisma     │
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │ PostgreSQL    │
                     └───────────────┘
```

UI:

```text
Tailwind CSS
     +
shadcn/ui
     +
Lucide React
```

Validation/forms:

```text
Zod
   +
React Hook Form
```

Security:

```text
Auth.js
   +
Argon2id
   +
Server-side RBAC
   +
Project-level authorization
```

Utilities:

```text
date-fns
dnd-kit
TanStack Table when required
```

Development:

```text
pnpm
ESLint
Prettier
Playwright
Git/GitHub
```

Deployment:

```text
Vercel
   +
Managed PostgreSQL
```

---

# 69. SOURCE OF TRUTH

Development must follow these documents:

```text
PROJECT_GUIDE.md
TECH_STACK.md
UI_GUIDE.md
```

Responsibilities:

### PROJECT_GUIDE.md

Defines:

```text
WHAT the system does.
```

### TECH_STACK.md

Defines:

```text
HOW the system is engineered.
```

### UI_GUIDE.md

Defines:

```text
HOW the system looks and behaves.
```

When generating new features, do not make technology or design decisions that contradict these documents without first updating the relevant source-of-truth document.

---

# 70. FINAL ENGINEERING PRINCIPLE

Dynamatrix Flow is an internal productivity system.

Optimize for:

```text
SHIP FAST
+
KEEP IT SIMPLE
+
KEEP IT SECURE
+
KEEP IT MAINTAINABLE
```

Do not over-engineer the first release.

The preferred MVP architecture is:

**Next.js + TypeScript + PostgreSQL + Prisma + Auth.js + Tailwind + shadcn/ui**

in a single full-stack application.

Build a strong modular monolith first.

Split services only when real technical requirements justify doing so.

---

**Product:** Dynamatrix Flow
**Company:** Dynamatrix Solution
**Document:** TECH_STACK.md
