# DYNAMATRIX FLOW

## UI/UX Design System & Interface Guide

**Product:** Dynamatrix Flow
**Company:** Dynamatrix Solution
**Product Type:** Internal Project & Team Management Workspace
**Design Version:** 1.0

---

# 1. PRODUCT IDENTITY

## Product Name

**Dynamatrix Flow**

## Product Descriptor

**Project & Team Workspace**

## Brand Presentation

Primary:

DYNAMATRIX
**FLOW**

Alternative horizontal presentation:

**DYNAMATRIX FLOW**

Do not repeatedly display "Dynamatrix Solution Project Management System" throughout the application.

The product should feel like an actual Dynamatrix software product.

---

# 2. PRODUCT DESIGN PHILOSOPHY

Dynamatrix Flow is used every day by:

* Company Leaders
* Project Leads
* Developers
* Designers
* QA
* Researchers
* Other team members

The interface therefore needs to prioritize:

1. Clarity
2. Speed
3. Focus
4. Information hierarchy
5. Low cognitive load
6. Consistency
7. Professional appearance

The application should feel like a premium modern SaaS workspace rather than a generic admin dashboard.

Think:

**Linear-style clarity + modern project management + Dynamatrix identity**

Do NOT directly copy another product.

---

# 3. DESIGN PERSONALITY

Use these characteristics:

**Professional**
The system represents Dynamatrix Solution internally.

**Modern**
Use current SaaS interface patterns.

**Technical**
Suitable for a software development company.

**Minimal**
Remove unnecessary decoration.

**Premium**
Good typography, spacing and subtle interaction.

**Fast**
Common actions should require very few clicks.

**Calm**
Avoid excessive colors competing for attention.

---

# 4. CORE VISUAL STRATEGY

Dynamatrix has four important brand accent colors:

Purple
Blue
Cyan
Green

However:

DO NOT use all four colors heavily throughout every screen.

The product interface should primarily use:

* Neutral backgrounds
* Dark navy navigation
* Purple/blue primary actions
* Semantic colors for statuses

Use brand colors intentionally.

---

# 5. PRIMARY COLOR PALETTE

## Brand Purple

```css
--brand-purple: #6B46FF;
```

Usage:

* Primary brand accent
* Selected navigation
* Important interactive highlights
* Focus states
* Occasional charts

---

## Primary Blue

```css
--brand-blue: #2563EB;
```

Usage:

* Links
* Interactive elements
* Information
* Secondary brand accent

---

## Cyan

```css
--brand-cyan: #00C2FF;
```

Usage:

* Small highlights
* Information indicators
* Data visualization
* Brand decorative accents

Do not use cyan for large text areas.

---

## Green

```css
--brand-green: #22C55E;
```

Usage:

* Success
* Completed
* Healthy status
* Positive system confirmation

---

# 6. PRIMARY APPLICATION COLOR

The application's main interactive color should be:

```css
--primary: #6B46FF;
--primary-hover: #5B36E8;
--primary-active: #4D2BD0;
```

Primary buttons use the primary purple.

Example:

```text
[ + Create Project ]
```

Do not make every clickable element purple.

---

# 7. APP BACKGROUND COLORS

## Main Background

```css
--background: #F7F8FC;
```

Use for the main application canvas.

## Surface

```css
--surface: #FFFFFF;
```

Use for:

* Cards
* Tables
* Dialogs
* Dropdowns
* Panels

## Secondary Surface

```css
--surface-secondary: #F1F3F8;
```

Use for:

* Filters
* Secondary controls
* Subtle containers
* Hover regions

---

# 8. SIDEBAR COLORS

The sidebar establishes Dynamatrix's technical identity.

```css
--sidebar: #0B1020;
--sidebar-secondary: #11182B;
--sidebar-text: #AAB4C8;
--sidebar-text-active: #FFFFFF;
--sidebar-hover: #151D33;
```

Selected navigation background:

```css
--sidebar-active: rgba(107, 70, 255, 0.16);
```

Selected indicator:

```css
--sidebar-indicator: #6B46FF;
```

The sidebar should feel premium and dark.

Do NOT use pure black `#000000`.

---

# 9. TEXT COLORS

Primary:

```css
--text-primary: #111827;
```

Secondary:

```css
--text-secondary: #667085;
```

Muted:

```css
--text-muted: #98A2B3;
```

Disabled:

```css
--text-disabled: #B8C0CC;
```

Inverse:

```css
--text-inverse: #FFFFFF;
```

Avoid pure black body text.

---

# 10. BORDER COLORS

Primary border:

```css
--border: #E4E7EC;
```

Subtle border:

```css
--border-subtle: #EEF0F4;
```

Strong border:

```css
--border-strong: #D0D5DD;
```

Focus:

```css
--border-focus: #6B46FF;
```

---

# 11. SEMANTIC COLORS

## Success

```css
--success: #16A34A;
--success-bg: #F0FDF4;
--success-border: #BBF7D0;
```

## Warning

```css
--warning: #D97706;
--warning-bg: #FFFBEB;
--warning-border: #FDE68A;
```

## Danger

```css
--danger: #DC2626;
--danger-bg: #FEF2F2;
--danger-border: #FECACA;
```

## Information

```css
--info: #2563EB;
--info-bg: #EFF6FF;
--info-border: #BFDBFE;
```

---

# 12. TASK STATUS COLORS

Statuses must be immediately recognizable.

## To Do

```css
color: #667085;
background: #F2F4F7;
```

Label:

`TO DO`

---

## In Progress

```css
color: #2563EB;
background: #EFF6FF;
```

Label:

`IN PROGRESS`

---

## Blocked

```css
color: #DC2626;
background: #FEF2F2;
```

Label:

`BLOCKED`

---

## In Review

```css
color: #7C3AED;
background: #F5F3FF;
```

Label:

`IN REVIEW`

---

## Completed

```css
color: #16A34A;
background: #F0FDF4;
```

Label:

`COMPLETED`

---

## Cancelled

```css
color: #64748B;
background: #F1F5F9;
```

Label:

`CANCELLED`

---

# 13. PRIORITY COLORS

Priority should be visible without dominating task cards.

## Critical

```css
#DC2626
```

## High

```css
#EA580C
```

## Medium

```css
#D97706
```

## Low

```css
#64748B
```

Use:

* Small icon
* Small badge
* Thin indicator

Do NOT fill an entire card red because a task is critical.

---

# 14. PROJECT STATUS COLORS

Planning:

```css
#64748B
```

Active:

```css
#2563EB
```

On Hold:

```css
#D97706
```

Completed:

```css
#16A34A
```

Cancelled:

```css
#DC2626
```

Archived:

```css
#667085
```

---

# 15. TYPOGRAPHY

Use:

**Inter**

Fallback:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  sans-serif;
```

Do not use decorative fonts inside the application.

---

# 16. TYPOGRAPHY SCALE

## Page Title

```css
font-size: 28px;
font-weight: 700;
line-height: 36px;
```

Example:

Projects

---

## Section Heading

```css
font-size: 20px;
font-weight: 600;
line-height: 28px;
```

---

## Card Heading

```css
font-size: 16px;
font-weight: 600;
line-height: 24px;
```

---

## Body

```css
font-size: 14px;
font-weight: 400;
line-height: 21px;
```

---

## Small

```css
font-size: 13px;
line-height: 18px;
```

---

## Caption

```css
font-size: 12px;
line-height: 16px;
```

---

# 17. SPACING SYSTEM

Use a consistent 4px-based spacing system.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Primary page spacing:

Desktop:

```text
24–32px
```

Mobile:

```text
16px
```

Card padding:

```text
20–24px
```

Compact task cards:

```text
16px
```

---

# 18. BORDER RADIUS

Small controls:

```css
6px
```

Buttons:

```css
8px
```

Inputs:

```css
8px
```

Cards:

```css
10px
```

Dialogs:

```css
12px
```

Do not use excessively rounded `20px+` cards.

This is productivity software, not a consumer social app.

---

# 19. SHADOWS

Keep shadows subtle.

Cards normally should rely primarily on borders.

```css
box-shadow:
0 1px 2px rgba(16, 24, 40, 0.04);
```

Dropdown:

```css
box-shadow:
0 8px 24px rgba(16, 24, 40, 0.10);
```

Dialog:

```css
box-shadow:
0 20px 48px rgba(16, 24, 40, 0.16);
```

Do not use heavy shadows on every card.

---

# 20. APPLICATION SHELL

Desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR │                 TOP BAR                            │
│         ├────────────────────────────────────────────────────┤
│         │                                                    │
│         │                 PAGE CONTENT                       │
│         │                                                    │
│         │                                                    │
│         │                                                    │
└──────────────────────────────────────────────────────────────┘
```

Sidebar:

```text
240–260px
```

Top bar:

```text
64px
```

Main content:

Flexible width.

Recommended maximum content width on large screens:

```text
1600px
```

---

# 21. SIDEBAR

Desktop example:

```text
DYNAMATRIX
FLOW

────────────

⌂  Dashboard

WORK

▣  Projects
✓  My Tasks
◷  Upcoming

COMPANY

♙  Team

ACTIVITY

♢  Notifications

────────────

AC
Abhishek Chaudhary
Developer
```

Use Lucide icons instead of Unicode icons in implementation.

Sidebar sections should have subtle uppercase labels.

---

# 22. SIDEBAR ACTIVE STATE

Example:

```text
│▣ Projects
```

Use:

* Purple left indicator
* Very subtle purple background
* White text
* Clear icon

Do not make active navigation look like a large bright button.

---

# 23. TOP BAR

The top bar contains:

Left:

* Breadcrumb
* Optional mobile menu

Center/right:

* Search
* Create action where appropriate
* Notifications
* User menu

Example:

```text
Projects / Expo Express

                    Search...    + New Task    🔔    AC
```

Keep the top bar clean.

---

# 24. PAGE HEADER

Example:

```text
Projects

Manage and monitor Dynamatrix projects.

                         [ Filter ] [+ New Project]
```

Structure:

Title

Short description

Actions

Avoid unnecessarily large hero-style headers.

---

# 25. DASHBOARD

Admin dashboard:

```text
Good morning, Abhishek

Here's what's happening across Dynamatrix.

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ACTIVE       │ │ IN PROGRESS  │ │ OVERDUE      │
│ PROJECTS     │ │ TASKS        │ │ TASKS        │
│              │ │              │ │              │
│ 8            │ │ 24           │ │ 4            │
└──────────────┘ └──────────────┘ └──────────────┘


PROJECT PROGRESS

Expo Express Marketplace          78%
████████████████░░░░

NexaEDU                            91%
██████████████████░


UPCOMING DEADLINES          TEAM ACTIVITY

Checkout UI                 Abhishek updated...
Payment API                 Suman completed...
Dashboard Design            Ram assigned...
```

Avoid filling the dashboard with meaningless statistics.

Every dashboard element should answer a useful question.

---

# 26. STAT CARDS

Stat card:

```text
┌────────────────────────┐
│ ACTIVE PROJECTS        │
│                        │
│ 8                      │
│                        │
│ 2 created this month   │
└────────────────────────┘
```

Use:

* Small muted label
* Strong number
* Optional useful context
* Optional small icon

Do not use huge colorful icon circles.

---

# 27. PROJECT CARD

Example:

```text
┌─────────────────────────────────────┐
│ Expo Express Marketplace     ACTIVE│
│                                     │
│ Multi-vendor commerce platform      │
│                                     │
│ Progress                            │
│ ███████████████░░░ 78%              │
│                                     │
│ Lead                                │
│ RS  Ram Sharma                      │
│                                     │
│ 👥 6 members     Due Oct 28          │
└─────────────────────────────────────┘
```

Card should clearly show:

* Project
* Status
* Short description
* Progress
* Lead
* Team
* Deadline

---

# 28. PROJECT WORKSPACE

Project page header:

```text
Expo Express Marketplace

ACTIVE   HIGH PRIORITY

Multi-vendor e-commerce marketplace

Lead: Ram Sharma
Aug 20 → Oct 28

                         [•••] [+ Add Task]
```

Below:

```text
Overview
Tasks
Board
Milestones
Resources
Team
Activity
Settings
```

Use tabs or sub-navigation.

---

# 29. PROJECT OVERVIEW

Use a clear information hierarchy.

Top:

Project progress.

Then:

```text
Total Tasks
Completed
In Progress
In Review
Blocked
Overdue
```

Then two-column layout:

```text
UPCOMING TASKS        RECENT ACTIVITY
```

Then:

```text
MILESTONES
```

Do not put every project feature on Overview.

---

# 30. TASK LIST

Desktop should primarily use a table/list.

Example:

```text
TASK                 STATUS        PRIORITY   ASSIGNEE     DUE

Checkout UI          In Progress   High       Abhishek     Sep 28
Payment API          Blocked       Critical   Suman        Sep 29
Dashboard            In Review     Medium     Hari         Oct 01
Login                 Completed     Low        Ram          Sep 20
```

Rows should be easy to scan.

Row height:

```text
48–56px
```

Allow filtering and sorting.

---

# 31. TASK KANBAN BOARD

Columns:

```text
TO DO        IN PROGRESS       BLOCKED        IN REVIEW        COMPLETED
```

Column header:

```text
IN PROGRESS  4
```

Task card:

```text
┌─────────────────────────────┐
│ Checkout UI                 │
│                             │
│ HIGH                        │
│                             │
│ AC  Abhishek                │
│                             │
│ Sep 28            70%       │
└─────────────────────────────┘
```

Cards should remain compact.

Avoid oversized Trello-style cards.

---

# 32. TASK DETAIL

Use a right-side drawer for quick task inspection where appropriate.

Width:

```text
480–560px
```

For complex task details, allow full page navigation.

Structure:

```text
Checkout UI

IN PROGRESS       HIGH

Project
Expo Express

Assignee
Abhishek

Due
Sep 28

Progress
██████████████░░ 70%

DESCRIPTION

Create checkout flow based on approved design.

SUBTASKS

✓ Address UI
✓ Shipping
○ Payment
○ Validation

UPDATES

...

COMMENTS

...
```

---

# 33. MY TASKS

Employee My Tasks page should prioritize personal work.

Header:

```text
My Tasks

Everything assigned to you.
```

Quick sections:

```text
TODAY
UPCOMING
OVERDUE
IN PROGRESS
IN REVIEW
COMPLETED
```

Default view should emphasize:

1. Overdue
2. Today
3. Upcoming

---

# 34. UPCOMING VIEW

Organize chronologically.

Example:

```text
TODAY

Checkout UI
Expo Express
HIGH                         5:00 PM


TOMORROW

Payment Integration
Expo Express
CRITICAL


THIS WEEK

Profile Screen
NexaEDU
MEDIUM
```

This should be extremely easy to scan.

---

# 35. TEAM PAGE

Desktop:

```text
TEAM

Search employee...             [+ Add Employee]


EMPLOYEE            ROLE              PROJECTS       ACTIVE TASKS

AC Abhishek         Developer            3               8
RS Ram Sharma       Project Lead         2               6
SK Suman            Backend              2               5
```

Clicking an employee opens their internal profile.

---

# 36. CREATE EMPLOYEE UI

Use a clean dialog or dedicated form.

Fields:

```text
Full Name
Email
Employee ID
Position
System Role
Temporary Password
```

Employee ID can provide:

```text
[ DMS-014 ] [Generate]
```

Password:

```text
[ ••••••••••• ] [Generate]
```

Primary action:

```text
[Create Employee]
```

After creation show:

```text
Employee Created

Employee ID
DMS-014

Temporary Password
**************

[Copy Credentials]

This temporary password is shown only now.
The employee must change it after first login.
```

Never show the password again later.

---

# 37. RESOURCES / KNOWLEDGE HUB

Resources are a major part of Dynamatrix Flow.

Header:

```text
Resources

Research, documentation and useful project links.

                         [+ Add Resource]
```

Filters:

```text
All
Research
Documentation
Development
Design
API
Client
Competitor
Tutorial
Other
```

---

# 38. RESOURCE CARD

Example:

```text
┌────────────────────────────────────────────┐
│ API                                        │
│                                            │
│ Khalti Payment Gateway Documentation       │
│                                            │
│ Official documentation for payment         │
│ gateway integration.                       │
│                                            │
│ docs.khalti.com ↗                          │
│                                            │
│ Added by Suman · Sep 24                    │
│                                            │
│ #payment #backend                          │
└────────────────────────────────────────────┘
```

Use a grid on large screens.

Switch to list/card layout on mobile.

External URLs should clearly show an external-link icon.

---

# 39. ADD RESOURCE

Form:

```text
Add Resource

Title *

URL *

Category *

Description

Tags

Related Task

[Cancel]       [Add Resource]
```

URL must be validated.

---

# 40. ACTIVITY TIMELINE

Example:

```text
TODAY

● 10:42 PM
  Abhishek moved Checkout UI
  In Progress → In Review

│

● 9:20 PM
  Ram assigned Checkout UI
  to Abhishek

│

● 8:40 PM
  Suman added a resource
  Khalti API Documentation
```

Use a subtle vertical timeline.

Do not make activity entries look like chat messages.

---

# 41. NOTIFICATIONS

Notification dropdown:

```text
Notifications                         Mark all read

● Ram assigned you Checkout UI
  Expo Express · 5m

● Checkout UI is due tomorrow
  1h

  Suman added a project resource
  3h

View all notifications
```

Unread notification:

* Very subtle primary tinted background
* Small indicator

Avoid bright notification cards.

---

# 42. BUTTONS

## Primary

Purple background.

```text
[Create Project]
```

## Secondary

White surface with border.

```text
[Cancel]
```

## Ghost

No permanent background.

```text
[•••]
```

## Destructive

Red.

```text
[Delete]
```

Standard height:

```text
40px
```

Compact:

```text
32px
```

Large:

```text
44px
```

---

# 43. FORMS

Standard form layout:

```text
Label

[ Input                               ]

Helper/error text
```

Input height:

```text
40–44px
```

Do not rely only on placeholders as labels.

Required fields:

```text
Project Name *
```

---

# 44. MODALS

Use dialogs for short actions:

* Create employee
* Add resource
* Confirm archive
* Confirm delete
* Small task actions

Use dedicated pages/drawers for complex forms.

Do not place giant forms inside tiny modals.

---

# 45. EMPTY STATES

Example:

```text
No projects yet

Create your first project to start organizing
your team's work.

[Create Project]
```

Empty states should explain:

What is empty?

Why does it matter?

What can the user do?

Avoid unnecessary illustrations.

---

# 46. LOADING STATES

Use:

* Skeleton cards
* Skeleton table rows
* Small button spinners

Do not show a full-screen spinner for normal page transitions.

---

# 47. ERROR STATES

Example:

```text
Unable to load tasks

Something went wrong while loading this project's tasks.

[Try Again]
```

Errors should be useful and understandable.

Do not expose raw backend errors.

---

# 48. TOASTS

Success:

```text
✓ Task updated
```

Error:

```text
! Unable to update task
```

Keep toast messages short.

Avoid using toasts for information that needs permanent visibility.

---

# 49. AVATARS

If an employee has no image, generate initials.

Example:

```text
AC
```

Avatar sizes:

```text
24px
32px
40px
48px
```

Avoid unnecessary huge profile photos.

---

# 50. ICON SYSTEM

Use:

**Lucide React**

Examples:

Dashboard → LayoutDashboard

Projects → FolderKanban

Tasks → CheckSquare

Upcoming → CalendarClock

Team → Users

Resources → Library

Notifications → Bell

Search → Search

Settings → Settings

External link → ExternalLink

Add → Plus

Do not mix multiple icon libraries.

---

# 51. PROGRESS BARS

Default background:

```css
#EAECF0
```

Progress:

```css
#6B46FF
```

Completed:

```css
#22C55E
```

Height:

```text
6–8px
```

Avoid giant progress bars.

---

# 52. TABLE DESIGN

Tables should use:

White surface.

Subtle borders.

Muted table header.

Comfortable row height.

Hover state.

Example header background:

```css
#F9FAFB
```

Avoid excessive vertical grid lines.

---

# 53. SEARCH

Global search should eventually support:

Projects

Tasks

Employees

Resources

Shortcut:

```text
Ctrl / Cmd + K
```

Search UI:

```text
Search Dynamatrix Flow...

Projects

Tasks

People

Resources
```

---

# 54. RESPONSIVE DESIGN

## Desktop

Sidebar permanently visible.

Tables allowed.

Kanban horizontal scrolling allowed.

Task details can use side drawer.

---

## Tablet

Collapsible sidebar.

Reduced page padding.

Cards adapt to 2-column layouts.

---

## Mobile

Use mobile navigation/drawer.

Do NOT simply shrink desktop screens.

Convert tables to cards.

Primary actions remain easy to reach.

Employee mobile usage should prioritize:

* My Tasks
* Task update
* Upcoming
* Notifications
* Project resources

---

# 55. MOBILE TASK CARD

Example:

```text
Checkout UI

Expo Express

IN PROGRESS    HIGH

Due Sep 28

Progress
████████████░░ 70%

AC Abhishek
```

---

# 56. ACCESSIBILITY

Minimum requirements:

* Keyboard navigation
* Visible focus states
* Proper labels
* Semantic HTML
* ARIA only when necessary
* Adequate contrast
* Do not communicate state using color alone
* Buttons must have accessible names
* Icons used alone require labels/tooltips

---

# 57. DARK MODE

Do NOT prioritize full dark mode for MVP.

The dark sidebar already gives the application strong Dynamatrix identity.

Build color tokens so a full dark mode can be added later without rewriting components.

---

# 58. ANIMATION

Animations should be subtle.

Recommended:

```text
150–200ms
```

Use for:

* Hover
* Dropdown
* Dialog
* Drawer
* Navigation selection

Avoid:

* Bouncing
* Floating cards
* Long transitions
* Constant gradient animations
* Excessive page entrance effects

Productivity is more important than decoration.

---

# 59. BRAND ACCENT RULE

Dynamatrix uses:

Purple → Blue → Cyan → Green

A subtle brand gradient may be used for:

* Logo treatment
* Login page accent
* Very small decorative elements
* Special branding surfaces

Example:

```css
linear-gradient(
  90deg,
  #6B46FF,
  #2563EB,
  #00C2FF,
  #22C55E
);
```

DO NOT use this gradient for:

* Every button
* Every card
* Table backgrounds
* Main page background
* Large blocks of text

The application itself should remain clean.

---

# 60. LOGIN PAGE

Suggested desktop composition:

```text
┌───────────────────────┬────────────────────────────┐
│                       │                            │
│   DYNAMATRIX           │        Welcome back        │
│   FLOW                 │                            │
│                       │ Employee ID                │
│   Project & Team       │ [DMS-001             ]    │
│   Workspace            │                            │
│                       │ Password                   │
│                       │ [••••••••••••         ]    │
│                       │                            │
│                       │ [      Sign In        ]    │
│                       │                            │
└───────────────────────┴────────────────────────────┘
```

Left panel:

Dark Dynamatrix branded surface.

Right panel:

Simple login form.

No public registration button.

---

# 61. FIRST LOGIN

If using a temporary password:

```text
Create your new password

Your administrator created your account with
a temporary password. Create a new password
before continuing.

New Password

Confirm Password

[Set Password & Continue]
```

Do not allow users to bypass this step.

---

# 62. BREADCRUMBS

Use breadcrumbs on nested screens.

Example:

```text
Projects / Expo Express / Tasks / Checkout UI
```

Do not show breadcrumbs unnecessarily on top-level pages.

---

# 63. DESIGN TOKENS

Recommended base CSS variables:

```css
:root {
  --background: #F7F8FC;
  --foreground: #111827;

  --surface: #FFFFFF;
  --surface-secondary: #F1F3F8;

  --primary: #6B46FF;
  --primary-hover: #5B36E8;
  --primary-active: #4D2BD0;

  --brand-blue: #2563EB;
  --brand-cyan: #00C2FF;
  --brand-green: #22C55E;

  --border: #E4E7EC;
  --border-subtle: #EEF0F4;
  --border-strong: #D0D5DD;

  --text-primary: #111827;
  --text-secondary: #667085;
  --text-muted: #98A2B3;

  --success: #16A34A;
  --warning: #D97706;
  --danger: #DC2626;
  --info: #2563EB;

  --sidebar: #0B1020;
  --sidebar-secondary: #11182B;
  --sidebar-text: #AAB4C8;
  --sidebar-active: rgba(107, 70, 255, 0.16);
  --sidebar-text-active: #FFFFFF;
}
```

All components should reference design tokens instead of randomly introducing colors.

---

# 64. SHADCN/UI RULE

Use shadcn/ui as a component foundation.

Good candidates:

* Button
* Input
* Textarea
* Select
* Dialog
* Dropdown Menu
* Sheet
* Tabs
* Avatar
* Tooltip
* Popover
* Command
* Calendar
* Badge
* Table
* Skeleton
* Alert Dialog

However:

Do NOT leave everything looking like untouched default shadcn.

Apply Dynamatrix Flow:

* Tokens
* Spacing
* Typography
* Radius
* States
* Layout

consistently.

---

# 65. INFORMATION DENSITY

This is a work application.

Use medium information density.

Avoid huge:

* Cards
* Padding
* Headers
* Empty spaces

At the same time, do not make the interface cramped.

The user should be able to see useful information without excessive scrolling.

---

# 66. DESIGN CONSISTENCY RULES

Always:

Use the same status color everywhere.

Use the same priority representation everywhere.

Use the same avatar sizes for equivalent contexts.

Use the same button hierarchy.

Use consistent spacing.

Use consistent page headers.

Use consistent forms.

Use consistent table styles.

Use consistent empty states.

Do not redesign the same component differently on different pages.

---

# 67. DASHBOARD PRINCIPLE

Do not create dashboards just to show charts.

Every widget must help the user answer something.

Admin:

"What needs attention across the company?"

Project Lead:

"What needs attention in my projects?"

Employee:

"What should I work on next?"

These questions should guide dashboard design.

---

# 68. EMPLOYEE EXPERIENCE PRINCIPLE

An employee should be able to log in and understand their work within approximately 5 seconds.

Primary information:

1. What is overdue?
2. What do I need to do today?
3. What am I currently working on?
4. What is coming next?
5. Is anything waiting for my response?

Do not make employees navigate through several project pages just to discover assigned work.

---

# 69. PROJECT LEAD EXPERIENCE PRINCIPLE

A Project Lead should quickly understand:

1. What is the team working on?
2. What is overdue?
3. What is blocked?
4. What requires review?
5. What deadline is approaching?
6. What has recently changed?

---

# 70. COMPANY LEADER EXPERIENCE PRINCIPLE

The Company Leader should quickly understand:

1. Which projects are active?
2. What is their progress?
3. Which deadlines are at risk?
4. What work is blocked?
5. What work is overdue?
6. How is work distributed?
7. What important activity occurred recently?

Do not require the leader to inspect every project individually.

---

# 71. RESOURCE EXPERIENCE PRINCIPLE

Resources should become the project's shared knowledge base.

A developer joining a project should be able to open:

Project → Resources

and quickly find:

* Research
* Documentation
* APIs
* Designs
* Client references
* Competitor references
* Useful technical links

Resources should therefore be searchable, categorized and easy to scan.

---

# 72. FINAL DESIGN RULE

When deciding between:

"Looks impressive"

and

"Is easy to understand"

choose:

**Easy to understand.**

When deciding between:

"More information"

and

"Relevant information"

choose:

**Relevant information.**

When deciding between:

"More decoration"

and

"Better hierarchy"

choose:

**Better hierarchy.**

Dynamatrix Flow should look premium because it is:

* Clear
* Consistent
* Fast
* Thoughtfully designed

not because it contains excessive visual effects.

---

# 73. FINAL PRODUCT FEEL

The finished system should feel like:

**A focused command center for Dynamatrix Solution's projects and team.**

It should NOT feel like:

* A generic purchased admin template
* An HR portal
* A school management system
* A colorful consumer application
* A clone of Trello
* A clone of Jira

The product identity should remain:

# DYNAMATRIX FLOW

**Project & Team Workspace**

Built for Dynamatrix Solution.
