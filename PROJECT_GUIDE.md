# DYNAMATRIX FLOW

## Project Guide

## Documentation authority

This guide defines product requirements. Detailed decisions belong to:

- `UI_GUIDE.md`: visual tokens, components, accessibility, and responsive behavior.
- `TECH_STACK.md`: technologies, architecture, folder structure, environment configuration, development and deployment standards.
- `DATABASE_SCHEMA.md`: exact entities, fields, relations, indexes, and data integrity rules.
- `RBAC_PERMISSIONS.md`: the permission matrix and server-side authorization rules.
- `WORKFLOWS.md`: business transitions and lifecycle behavior.
- `ROUTES_AND_PAGES.md`: route structure and page responsibilities.
- `MVP_PLAN.md`: implementation order and phase exit requirements.
- `TESTING_SECURITY.md`: validation, security tests, and production readiness.

Product examples do not override these detailed specifications. Report conflicts before implementation. The original supplied brief is preserved in `project_overview.md`; this reconciled guide uses the approved Dynamatrix Flow name, UI_GUIDE.md filename, and Phases 0–12.

Build a production-ready internal **Project, Task, Team, Resource, and Workflow Management System** for our IT company:

**Company:** Dynamatrix Solution
**Product Name:** Dynamatrix Flow

The purpose of this system is to allow company leadership to create projects, appoint project leads, create employee accounts, assign employees to projects, manage tasks, track progress, share research/resources, monitor deadlines, and maintain a complete history of project activity.

The system must be simple, modern, fast, professional, responsive, and designed specifically for an IT/software company.

---

# 1. TECHNOLOGY STACK

Use a fast modern web stack.

## Core

* Next.js latest stable version
* TypeScript
* React
* Node.js
* PostgreSQL
* Prisma ORM

## UI

* Tailwind CSS
* shadcn/ui
* Lucide Icons
* Responsive desktop/tablet/mobile design

## Authentication

Implement secure credential-based authentication.

Users log in using:

* Employee ID / Username
* Password

Use Argon2id password hashing, as required by TECH_STACK.md and TESTING_SECURITY.md.

Never store plain-text passwords.

Use secure HTTP-only sessions/cookies.

Implement route protection and role-based authorization.

---

# 2. SYSTEM ROLES

The system must support at least three main roles.

## COMPANY LEADER / ADMIN

Has organization-level control.

Can:

* Create employees
* Generate/set Employee ID
* Generate temporary password
* Activate/deactivate employee accounts
* Reset employee password
* View employees
* Edit employee information
* Create projects
* Edit projects
* Archive projects
* Assign Project Lead
* Add employees to projects
* Remove employees from projects
* View every project
* View every task
* View project progress
* View employee workload
* View overdue tasks
* View blocked tasks
* View upcoming deadlines
* View company activity
* Manage project resources
* Change project status
* Manage permissions where appropriate

Company Leader should have access to the complete organization.

---

# 3. EMPLOYEE ACCOUNT CREATION

Employees must NOT need public registration.

There should be no normal public "Sign Up" functionality.

Accounts are created internally by the Company Leader/Admin.

Example:

Employee Name:
Ram Sharma

Employee ID:
DMS-001

Temporary Password:
Automatically generated secure password

Role:
Employee

Position:
Frontend Developer

After account creation, display the generated credentials to the Admin once.

Example:

Employee ID: DMS-001
Temporary Password: ********

The Admin can securely provide these credentials to the employee.

IMPORTANT:

The actual password must never be stored in plain text.

Store only the password hash.

If showing an automatically generated temporary password, show it only immediately after account creation.

Require the employee to change the temporary password after their first successful login.

Support:

* Force password change
* Admin password reset
* Account activation/deactivation
* Last login timestamp

Employee IDs should be unique.

Suggested format:

DMS-001
DMS-002
DMS-003

Do not use database IDs as Employee IDs.

---

# 4. PROJECT CREATION

Company Leader/Admin creates a project.

Project fields should include:

* Project Name
* Project Code
* Description
* Client Name
* Project Lead
* Start Date
* Expected Deadline
* Priority
* Project Status
* Project Progress
* Technology/Tags
* Internal Notes
* Created By
* Created At
* Updated At

Example statuses:

* Planning
* Active
* On Hold
* Completed
* Cancelled
* Archived

Example priorities:

* Low
* Medium
* High
* Critical

---

# 5. PROJECT LEAD

Every project can have a designated Project Lead.

The Project Lead must be an existing active employee.

Project Lead permissions should apply primarily to projects they lead.

A Project Lead can:

* View assigned project
* View project members
* Add/manage tasks
* Assign tasks to project members
* Create subtasks
* Set priorities
* Set deadlines
* Update project information where permitted
* Manage milestones
* Review task progress
* Review completed work
* Manage project resources
* Add project links
* Comment on tasks
* View project activity
* Monitor overdue tasks
* Monitor blocked tasks

A Project Lead must NOT automatically receive organization-wide Admin permissions.

---

# 6. PROJECT MEMBERS

After creating employees, the Company Leader can add them to projects.

Example:

PROJECT:
Expo Express Marketplace

PROJECT LEAD:
Ram Sharma

MEMBERS:

Abhishek — Frontend Developer
Suman — Backend Developer
Hari — UI/UX Designer
Ramesh — QA

One employee can belong to multiple projects.

Store project membership separately from the employee account.

Support project-specific roles such as:

* Project Lead
* Developer
* Designer
* QA
* Researcher
* Other

---

# 7. TASK MANAGEMENT

Tasks are associated with projects.

Task fields:

* Task ID
* Project
* Milestone (optional)
* Title
* Description
* Assigned To
* Created By
* Priority
* Status
* Progress
* Start Date
* Due Date
* Estimated Effort (optional)
* Tags
* Created At
* Updated At
* Completed At

Task statuses:

* To Do
* In Progress
* Blocked
* In Review
* Completed
* Cancelled

Task priorities:

* Low
* Medium
* High
* Critical

Only appropriate authorized users should be able to assign tasks.

Normally:

Admin → can assign tasks anywhere.

Project Lead → can assign tasks within projects they lead.

Employees → cannot arbitrarily assign work to other employees unless explicitly granted permission.

---

# 8. EMPLOYEE TASK DASHBOARD

After login, employees should immediately see their work.

Create a "My Tasks" dashboard.

Show sections such as:

## Today

Tasks due today.

## Upcoming

Tasks assigned for upcoming days.

## Overdue

Tasks whose deadline has passed.

## In Progress

Currently active tasks.

## In Review

Tasks submitted for review.

## Completed

Recently completed tasks.

Allow filtering by:

* Project
* Status
* Priority
* Due Date
* Assignee where permitted

---

# 9. TASK PROGRESS UPDATES

Employees must be able to update their assigned tasks.

They can:

* Change allowed status
* Update progress percentage
* Add progress notes
* Add comments
* Mark task as blocked
* Explain blocker
* Submit task for review
* Mark work complete according to workflow
* Add relevant links/resources

Example update:

Status:
In Progress

Progress:
70%

Update:
"Completed product listing UI and API integration."

Blocker:
"Waiting for final product filtering API."

Every important update must create an Activity Log entry.

---

# 10. TASK REVIEW FLOW

Support a simple review workflow.

Example:

To Do
↓
In Progress
↓
In Review
↓
Completed

Employees can submit work for review.

Project Lead can review it.

If changes are required, the Project Lead can move the task back to In Progress and provide feedback.

Do not permanently delete task history when statuses change.

---

# 11. SUBTASKS

Tasks can contain subtasks.

Example:

Task:
Checkout Module

Subtasks:

* Address UI
* Shipping selection
* Payment selection
* Order summary
* API integration
* Validation
* Testing

Each subtask should support:

* Title
* Completion state
* Assignee if required
* Due date if required

---

# 12. PROJECT MILESTONES

Projects should support milestones.

Example:

Project:
Expo Express Marketplace

Milestone 1:
UI/UX Design

Milestone 2:
Frontend Development

Milestone 3:
Backend Development

Milestone 4:
Integration

Milestone 5:
Testing

Milestone 6:
Deployment

Milestone fields:

* Name
* Description
* Start Date
* Deadline
* Status
* Progress

Tasks can optionally belong to a milestone.

---

# 13. PROJECT RESOURCES / KNOWLEDGE HUB

This is an IMPORTANT feature.

Every project must contain a dedicated:

**Resources**

section.

Team members should be able to share useful project information.

Resources can include:

* Research sources
* Articles
* Documentation
* API documentation
* GitHub repositories
* Design references
* Figma links
* Google Drive links
* Competitor references
* Client references
* Tutorials
* Technical documentation
* Stack Overflow links
* Videos
* Meeting references
* Useful websites
* Other project-related links

Resource fields:

* Title
* URL
* Description
* Category
* Tags
* Added By
* Project
* Related Task (optional)
* Created At
* Updated At

Resource categories:

* Research
* Documentation
* Development
* Design
* API
* Client Reference
* Competitor
* Meeting
* Tutorial
* Other

Example:

Title:
Khalti Payment Gateway Documentation

Category:
API

URL:
[external URL]

Description:
Official API documentation being used for payment integration.

Added By:
Suman

Related Task:
Payment Gateway Integration

Allow project members to quickly copy/open resource links.

Implement search and filtering.

---

# 14. RESOURCE PERMISSIONS

Project members can add resources to projects they belong to.

Project Leads can:

* Add
* Edit
* Organize
* Archive/remove inappropriate resources

Admin can manage all resources.

Maintain activity history for important resource actions.

---

# 15. PROJECT OVERVIEW

Each project should have a workspace.

Recommended navigation:

Overview
Tasks
Board
Milestones
Resources
Team
Activity
Settings

Project Overview should show:

* Project name
* Project Lead
* Members
* Project status
* Priority
* Start date
* Deadline
* Overall progress
* Completed tasks
* In-progress tasks
* Review tasks
* Blocked tasks
* Overdue tasks
* Upcoming deadlines
* Recent activity

---

# 16. TASK BOARD

Create a Kanban board.

Columns:

TO DO

IN PROGRESS

BLOCKED

IN REVIEW

COMPLETED

Allow authorized status changes through drag-and-drop if implemented safely.

Always enforce permissions server-side.

Never trust only client-side UI restrictions.

---

# 17. COMPANY LEADER DASHBOARD

The Admin dashboard should provide a quick organization overview.

Show:

* Total Active Projects
* Completed Projects
* Projects On Hold
* Total Employees
* Active Employees
* Tasks In Progress
* Tasks Completed
* Overdue Tasks
* Blocked Tasks
* Tasks In Review

Include:

## Project Progress

Display active projects with progress indicators.

## Upcoming Deadlines

Show important project/task deadlines.

## Recent Activity

Show meaningful organization activity.

## Team Workload

Show task distribution across employees.

Do NOT evaluate employees based solely on number of completed tasks.

Workload information is for project planning.

---

# 18. PROJECT LEAD DASHBOARD

Project Leads need a dashboard focused on projects they lead.

Show:

* Projects I Lead
* Tasks Assigned
* Tasks In Progress
* Tasks Awaiting Review
* Blocked Tasks
* Overdue Tasks
* Upcoming Deadlines
* Recent Team Updates

---

# 19. EMPLOYEE DASHBOARD

Employee dashboard should be intentionally simple.

Show:

"Good Morning, [Employee]"

Then:

My Tasks

Today

Upcoming

Overdue

In Progress

In Review

Recently Completed

My Projects

Recent Notifications

Do not overwhelm employees with organization-wide information they do not need.

---

# 20. COMMENTS

Tasks should support comments.

Users can discuss task-specific work.

Comment fields:

* ID
* Task ID
* User ID
* Content
* Created At
* Updated At

Support mentions later if needed.

For MVP, standard comments are enough.

---

# 21. NOTIFICATIONS

Create an internal notification system.

Generate notifications for important events such as:

* New task assigned
* Task reassigned
* Project assignment
* Project Lead assignment
* Task submitted for review
* Task reviewed
* Comment added to relevant task
* Deadline approaching
* Task overdue
* Important project update

Notification fields:

* User
* Type
* Title
* Message
* Related Entity
* Read/Unread
* Created At

Provide a notification dropdown in the top navigation.

Provide a dedicated notifications page if needed.

---

# 22. ACTIVITY LOG

This is a critical system feature.

Maintain audit/activity history.

Examples:

"Ram created project Expo Express."

"Admin added Abhishek to Expo Express."

"Ram assigned Checkout UI to Abhishek."

"Abhishek changed Checkout UI from To Do to In Progress."

"Abhishek submitted Checkout UI for review."

"Ram marked Checkout UI as Completed."

"Suman added Khalti API Documentation to Resources."

Store:

* Actor
* Action
* Entity Type
* Entity ID
* Project
* Metadata
* Timestamp

Do not expose sensitive information such as passwords in activity logs.

---

# 23. SEARCH

Provide global/project search.

Users should be able to search appropriate accessible data including:

* Projects
* Tasks
* Employees
* Resources

Respect permissions during search.

Never expose unauthorized project information through search results.

---

# 24. FILTERING

Provide practical filters.

Tasks:

* Project
* Assignee
* Status
* Priority
* Due Date
* Milestone

Projects:

* Status
* Project Lead
* Priority

Resources:

* Category
* Added By
* Tag
* Related Task

---

# 25. SECURITY

Security must be implemented from the beginning.

Requirements:

* Password hashing
* Secure authentication
* Secure HTTP-only cookies/sessions
* Server-side authorization
* Input validation
* Database validation
* Protected routes
* Role-based access control
* Project membership validation
* CSRF protection where applicable
* Rate limiting for login
* Safe error handling
* No password logging
* No secrets committed to Git
* Environment variables
* Production-safe database configuration

Admin UI permissions alone are NOT sufficient.

Every sensitive server operation must verify authorization.

---

# 26. DATABASE DESIGN

Design a normalized PostgreSQL schema.

At minimum consider:

User

EmployeeProfile

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

Session/Auth-related tables

Create proper:

* Primary keys
* Foreign keys
* Unique constraints
* Indexes
* Enums where appropriate
* createdAt
* updatedAt

Use soft deletion/archive where historical records matter.

---

# 27. PROJECT PROGRESS

Do not make project progress purely manual.

Provide calculated progress based on task completion where appropriate.

A basic MVP formula can be:

Completed Tasks / Total Active Tasks × 100

However, design the data model so weighted tasks or milestone-based progress can be added later.

Handle projects with zero tasks safely.

---

# 28. UPCOMING TASKS

Upcoming tasks are important.

Employees should see:

Today

Tomorrow

Next 7 Days

Later

Project Leads should see upcoming tasks for their projects.

Admin should see important upcoming tasks across the company.

Sort intelligently by:

1. Overdue
2. Due soon
3. Priority
4. Due date

---

# 29. RESPONSIVE DESIGN

Desktop is the primary management experience.

But the application must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

Employees should be able to update tasks from their phones.

Do not simply shrink desktop tables on mobile.

Create responsive card/list representations where necessary.

---

# 30. UI DIRECTION

Use a modern professional SaaS dashboard style.

Brand:
Dynamatrix Solution

Style:

* Premium
* Clean
* Minimal
* Modern
* Technical
* Professional
* High information clarity

Avoid:

* Excessive gradients
* Excessive animations
* Glassmorphism everywhere
* Huge cards
* Oversized text
* Unnecessary decorative elements

Use subtle Dynamatrix brand accents.

The interface should feel like a professional internal software product.

---

# 31. MAIN APPLICATION NAVIGATION

Desktop sidebar:

DYNAMATRIX
Workspace

Dashboard

WORK
Projects
My Tasks
Calendar / Upcoming

COMPANY
Team

ACTIVITY
Notifications

ACCOUNT
Profile
Settings

Admin-only sections should appear conditionally.

---

# 32. PROJECT NAVIGATION

Inside a project:

Overview

Tasks

Board

Milestones

Resources

Team

Activity

Settings

Do not put everything on one massive project page.

---

# 33. CODE QUALITY

Use a clean scalable architecture.

Requirements:

* Strict TypeScript
* Reusable components
* Server-side validation
* Centralized authorization logic
* Clean database service/repository boundaries where useful
* Proper error handling
* Loading states
* Empty states
* Error states
* Skeletons where appropriate
* No duplicated business logic
* No giant 1000-line components

Use clear naming.

Do not over-engineer the MVP.

---

# 34. PROJECT STRUCTURE

Follow `TECH_STACK.md`, Section 38, for the application directory structure. Use `src/app`, `src/components`, `src/features`, `src/server`, `src/lib`, `src/hooks`, `src/types`, and `src/config`. Business logic belongs in server services; authorization belongs in the centralized server authorization layer.

Create directories and files as their implementation phase requires them.

---
# 35. SEED DATA

Create development seed data.

Include:

Admin:
Dynamatrix Leader

Employees:
Frontend Developer
Backend Developer
UI/UX Designer
QA

Example projects.

Example tasks.

Example resources.

Do not use production passwords in seed files.

---

# 36. MVP PRIORITY

Follow `MVP_PLAN.md` as the authoritative implementation sequence:

0. Repository & Foundation
1. PostgreSQL & Prisma
2. Authentication & Security
3. Employee Management
4. Projects & Membership
5. Tasks
6. Review Workflow & Comments
7. Kanban & Milestones
8. Resources / Knowledge Hub
9. Notifications & Activity
10. Dashboards
11. Search, Filters & Responsive UX
12. Testing & Production Readiness

Implement and validate one phase at a time. Stop after each phase unless explicitly instructed to continue. Phase 0 does not include authentication, Prisma models, or business features.

---
# 37. DO NOT BUILD YET

Do not unnecessarily increase MVP scope with:

* Payroll
* Full HR system
* Attendance
* Employee surveillance
* Complex chat
* Video calls
* Accounting
* CRM
* AI assistant
* Complex Gantt engine
* Client portal
* Billing system

Architect cleanly enough that these can be added later.

---

# 38. DOCUMENTATION

Before implementing the full application, create:

## PROJECT_GUIDE.md

Include:

* Product overview
* Goals
* User roles
* Permissions matrix
* Features
* User flows
* Architecture
* Technology decisions
* Database entities
* Authentication
* Authorization
* Project workflow
* Task workflow
* Resource workflow
* Notification strategy
* Activity logging
* Folder structure
* API/server architecture
* Security
* Environment configuration
* Development setup
* Build phases
* Testing strategy
* Deployment strategy
* Future roadmap

## UI_GUIDE.md

Include:

* Design philosophy
* Dynamatrix visual direction
* Color tokens
* Typography
* Spacing
* Border radius
* Shadows
* Icon usage
* Sidebar
* Topbar
* Buttons
* Forms
* Inputs
* Selects
* Dialogs
* Drawers
* Cards
* Tables
* Badges
* Status components
* Priority components
* Progress components
* Task cards
* Kanban board
* Project cards
* Employee avatars
* Resource cards
* Notifications
* Activity timeline
* Empty states
* Loading states
* Error states
* Responsive behavior
* Desktop layouts
* Mobile layouts
* Accessibility requirements

These documents should be treated as the source of truth during implementation.

---

# 39. IMPORTANT BUSINESS RULE

The hierarchy should remain clear:

COMPANY LEADER / ADMIN
↓
Creates Employee Accounts
↓
Creates Project
↓
Assigns Project Lead
↓
Adds Employees to Project
↓
PROJECT LEAD
↓
Creates & Assigns Tasks
↓
EMPLOYEE
↓
Works on Task
↓
Updates Progress
↓
Submits for Review
↓
PROJECT LEAD
↓
Reviews / Requests Changes / Completes
↓
ADMIN
↓
Can Monitor Overall Company Progress

At the same time:

PROJECT MEMBERS
↓
Share Research / Documentation / Useful Links
↓
PROJECT RESOURCE HUB
↓
Knowledge remains attached to the project.

---

# 40. FINAL REQUIREMENT

Do not immediately generate random pages independently.

First understand the complete product architecture.

Read all nine source-of-truth documents first, then implement strictly according to MVP_PLAN.md, starting with Phase 0 only.

Maintain consistent architecture and design throughout the application.

The final product should feel like a real internal product built specifically for **Dynamatrix Solution**, not a generic admin template.
