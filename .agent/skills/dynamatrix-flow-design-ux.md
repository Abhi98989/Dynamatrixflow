---
description: |
  Design and UX skill for Dynamatrix Flow, Dynamatrix Solution's
  internal Project & Team Workspace. Use for visual identity, layout,
  navigation, dashboards, task UX, project workspaces, resources, forms,
  microcopy, responsive behavior, accessibility, empty/error/loading
  states, and design review. Trigger whenever a screen risks becoming a
  generic SaaS dashboard or accumulating unnecessary cards, padding,
  shadows, gradients, radius, widgets, or dead space.
name: dynamatrix-flow-design-ux
---

# Dynamatrix Flow Design & UX Skill

## 0. Hard Constraints (check first, every screen)

These are ceilings, not defaults to reach for. Undershoot when possible.

- **Padding:** never exceed the values in §1. If a card "feels empty,"
  reduce the card, not increase the padding.
- **Color:** at most one accent color (`--brand-indigo`) plus semantic
  state colors, visible per screen. No decorative color. No color used
  twice for two different meanings.
- **Shadow:** zero shadow on any static, resting surface (cards, rows,
  panels, page sections). Shadow exists only on things floating above
  the page: dropdowns, dialogs, drawers, popovers, toasts, a dragged
  Kanban card. That's the entire list — nothing else ever gets one.
- **Radius:** use exactly the four values in §1. Never introduce a
  fifth. Never use a pill/full radius except a literal status dot or
  avatar.
- **Vertical space:** no stacked empty spacers. Spacing between
  sections comes from the 4px scale, never eyeballed.
- **One accent per view:** a dashboard, table, or form should read as
  mostly neutral (background/surface/border/text) with brand indigo
  appearing only on the primary action and active-state indicators.

If a screen fails any bullet above, fix that before anything else in
this skill.

## 1. Spacing, Radius, Shadow — the only values that exist

Spacing scale (4px system): `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
Nothing outside this scale.

| Surface | Padding |
|---|---|
| Desktop page padding | 20–24px |
| Mobile page padding | 12–16px |
| Compact card | 12px |
| Standard card | 16px |
| Detail / form surface | 20px |
| Task / table row height | 40–44px |
| Gap between stat cards / grid items | 12–16px |
| Gap between major page sections | 24–32px |

If a component needs more padding than this to look right, the
component's content or size is wrong, not the padding.

Radius — four values, no exceptions:

- Small control (checkbox, chip, tag) — 4px
- Button / input — 6px
- Card — 8px
- Dialog / drawer / large surface — 10px

Shadow — three tokens, elevation-only, nothing else uses them:

```css
--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);   /* dropdown, popover */
--shadow-md: 0 4px 12px rgba(16, 24, 40, 0.08);  /* dialog, drawer */
--shadow-lg: 0 8px 24px rgba(16, 24, 40, 0.10);  /* dragged Kanban card */
```

Cards, rows, sidebars, topbars, and page sections use a 1px `--border`
instead of a shadow to separate from the background. Never both.

## 2. Design Philosophy

Dynamatrix Flow is an operational workspace used repeatedly throughout
the workday. It is not a marketing dashboard, HR portal, Trello clone,
Jira clone, or collection of colorful KPI cards.

Every design decision should answer:

> Does this help the person understand what needs attention and act on
> it faster?

The product should feel **focused, professional, modern, calm,
technical, trustworthy, fast, and intentionally minimal**. Relevant
information beats more information; hierarchy beats decoration; clarity
beats novelty; speed beats animation; consistency beats page-by-page
creativity; less beats more, always.

Before adding anything — a card, a badge, an icon, a color, a pixel of
padding — ask whether it communicates useful information, enables an
action, or establishes necessary hierarchy. If not, remove it. When in
doubt, remove it anyway and see if anything was actually lost.

## 3. Design for the Role

### Company Leader / Admin
Primary question: **What needs attention across the company?**
Prioritize active projects, progress, deadlines, overdue work, blockers,
review bottlenecks, workload context, and important recent activity.

### Project Lead
Primary question: **What needs attention in my projects?**
Prioritize review queue, blocked/overdue work, approaching milestones,
task assignment, team updates, and project resources.

### Employee
Primary question: **What should I work on next?**
Within about five seconds after login the employee should understand:
overdue items, what's due today, what they're currently working on,
what's coming next, and what is waiting on them. Never require
browsing project-by-project to discover assigned work.

## 4. Color System

Dark navy + indigo + blue + cyan identity. Purple is a brand accent,
never the operational UI's dominant color.

### Primary Brand

```css
:root {
  --brand-indigo: #5B5FEF;
  --brand-indigo-hover: #4C50D8;
  --brand-indigo-active: #4145C2;
  --brand-blue: #2563EB;
  --brand-cyan: #06B6D4;
  --brand-violet: #7C3AED;
  --brand-green: #16A34A;
}
```

`#5B5FEF` is the only color allowed on primary buttons, active nav
state, focus rings, links, and progress fill. Blue, cyan, and violet are
reserved for the login/promo gradient and for status meaning (§6) — not
for general UI decoration.

### Neutral Surfaces

```css
:root {
  --background: #F6F7FB;
  --surface: #FFFFFF;
  --surface-subtle: #F9FAFC;
  --surface-muted: #F0F2F7;

  --text-primary: #101828;
  --text-secondary: #475467;
  --text-muted: #667085;
  --text-disabled: #98A2B3;
  --text-inverse: #FFFFFF;

  --border: #E4E7EC;
  --border-subtle: #EEF1F5;
  --border-strong: #D0D5DD;
}
```

### Sidebar

```css
:root {
  --sidebar-bg: #0B1020;
  --sidebar-surface: #11182B;
  --sidebar-hover: #151D33;
  --sidebar-text: #AAB4C8;
  --sidebar-text-active: #FFFFFF;
  --sidebar-active-bg: rgba(91,95,239,.16);
  --sidebar-indicator: #6D72FF;
  --sidebar-border: rgba(255,255,255,.08);
}
```

### Semantic Colors

```css
--success: #15803D;   --success-bg: #F0FDF4;   --success-border: #BBF7D0;
--warning: #B45309;   --warning-bg: #FFFBEB;   --warning-border: #FDE68A;
--danger:  #DC2626;   --danger-bg:  #FEF2F2;   --danger-border: #FECACA;
--info:    #2563EB;   --info-bg:    #EFF6FF;   --info-border:  #BFDBFE;
```

Color communicates meaning, never decoration. Always pair a state color
with a label or icon — never color alone. A background tint (`-bg`) is
used only on the badge/pill itself, never on a whole card or row.

## 5. Typography & Icons

`Inter, ui-sans-serif, system-ui, sans-serif`.

- Page title: 22–24px / 600 (not 26–28 — operational pages don't need
  marketing-scale headings)
- Section title: 16–18px / 600
- Card title: 14–15px / 600
- Body: 14px / 400
- Small: 13px
- Caption: 12px

**Lucide React only.** Same action → same icon, everywhere. Icons
support a text label; they don't replace it except in a toolbar with a
tooltip. Icon-only actions need accessible names.

## 6. Task Status & Priority

| Status | Foreground | Background |
|---|---|---|
| To Do | `#667085` | `#F2F4F7` |
| In Progress | `#2563EB` | `#EFF6FF` |
| Blocked | `#DC2626` | `#FEF2F2` |
| In Review | `#7C3AED` | `#F5F3FF` |
| Completed | `#15803D` | `#F0FDF4` |
| Cancelled | `#64748B` | `#F1F5F9` |

Priority (text/icon only — no filled background):
Critical `#DC2626` · High `#EA580C` · Medium `#D97706` · Low `#64748B`

Badges are compact (fit-content, 4px/8px padding, 4px radius). Never
fill an entire row or card with status/priority color.

## 7. Brand Gradient

The UI is flat. Gradient exists in exactly these places and nowhere
else: logo, app icon, login screen accent, promotional assets.

```css
linear-gradient(135deg, #5B5FEF 0%, #2563EB 48%, #06B6D4 100%);
```

Never on buttons, cards, tables, page backgrounds, status badges, or
body text.

## 8. Application Shell

Desktop: 248px dark sidebar + 56–60px topbar + flexible content, max
content width ~1600px.

```text
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

Navigation is role-aware — never show inaccessible items as previews.
Topbar stays quiet: breadcrumb/context, search, one context-appropriate
create action, notifications, user. No topbar shadow — a 1px bottom
border separates it from content.

## 9. Dashboard UX

Dashboards are **attention systems**, not KPI collections.

- Admin: Active Projects, Overdue, Blocked, In Review, Project
  Progress, Upcoming Deadlines, Recent Activity, Team Workload.
- Project Lead: Needs Review, Blocked, Overdue, Upcoming Deadlines,
  Recent Team Updates, Projects I Lead.
- Employee: Overdue, Today, In Progress, Upcoming, In Review, My
  Projects.

Use the smallest set of stat cards that answers the role's primary
question — usually 3–5, never more. No icon circles, no gradients, no
percentage deltas without a reason someone would act on them. Stat
cards use flat surface + 1px border, never shadow.

## 10. Project Workspace

Header: project name/code, status, priority, lead, deadline, progress —
one row, no wasted vertical space.

```text
Overview | Tasks | Board | Milestones | Resources | Team | Activity | Settings
```

Overview summarizes; dedicated tabs manage. Don't duplicate every
feature into Overview.

## 11. Tasks

Desktop task list is a compact table:

```text
Task | Status | Priority | Assignee | Due
```

Row height 40–44px (§1). Keep important filters visible above the
table, not hidden in a menu.

Kanban columns:

```text
TO DO | IN PROGRESS | BLOCKED | IN REVIEW | COMPLETED
```

Cards are compact: title, priority, assignee, due, progress if useful.
No oversized Trello-style cards, no cover images, no shadow at rest —
shadow appears only while a card is being dragged.

Task detail: a 480–520px right drawer for quick inspection, a full page
only for genuinely complex detail.

## 12. My Tasks & Upcoming

`My Tasks` attention order: Overdue → Today → In Progress → Upcoming →
In Review → Completed.

`Upcoming` groups: OVERDUE / TODAY / TOMORROW / THIS WEEK / LATER.
Don't make every future task look urgent — reserve danger/warning color
for Overdue and Today only.

## 13. Resources / Knowledge Hub

Feels like an organized knowledge base, not a bookmark dump.

```text
All | Research | Documentation | Development | Design | API | Client | Competitor | Tutorial | Other
```

Each item: category, title, short description, hostname/link, tags,
added-by, date, optional related task. Prefer a compact list over cards
whenever a list scans faster.

## 14. Team & Activity

Team table:

```text
Employee | Position / Project Role | Projects | Active Tasks | Status
```

Never present task count as a performance score.

Activity is an audit timeline, not chat — compact
actor/action/entity/state/timestamp, one line per event:

```text
10:42 AM
Abhishek moved "Checkout UI"
In Progress → In Review
```

## 15. Forms

Group fields by the user's mental model, not database structure. Every
field has a persistent label (no placeholder-as-label). Validate inline
in plain language. Field vertical gap: 16px. Section gap: 24px.

Create Employee: Full Name, Email, Employee ID, Position, System Role,
Temporary Password. Show generated credentials once with a clear Copy
action and a warning to change the password on first login.

## 16. Components

- Primary button: solid `#5B5FEF`, hover `#4C50D8`, active `#4145C2`,
  white text, 6px radius, no shadow.
- Secondary: subtle surface + 1px border, no shadow.
- Ghost: no background, no border, until hover.
- Destructive: red, reserved for destructive actions only.
- Heights: compact 32px, standard 40px, large 44px.
- Tables: `#F9FAFB` header, `#E4E7EC` borders, white body, subtle hover,
  no heavy vertical grid lines, no zebra striping.
- Progress bar: 6px track `#EAECF0`, fill `#5B5FEF`, complete `#16A34A`.
- Badges: for actual state/role/category only — not every metadata
  value.

## 17. Empty, Error & Loading States

Empty states: what's empty, and the one useful next action. A small
icon is fine; no full-page decorative illustration.

Errors: what happened, what to do next. Never expose stack traces,
Prisma errors, HTTP codes, or database details.

Loading: skeleton rows/cards, localized to the region loading. Avoid
routine full-screen spinners.

## 18. Microcopy

Active, specific verbs:

```text
Create Project · Assign Task · Submit for Review · Request Changes ·
Mark Complete · Add Resource · Archive Project
```

Avoid vague labels (`Submit`, `Proceed`, `Execute`) when a specific verb
exists. Keep the same verb for the same action everywhere.

## 19. Motion

150–200ms transitions for dropdowns, dialogs, drawers, hover, nav, and
Kanban drag. No bouncing, no floating cards, no ambient gradient
animation, no page-wide entrance animation, no per-row animation.

## 20. Search & Filters

Global search covers Projects, Tasks, Employees, Resources, grouped by
entity. Shortcut: `Ctrl/Cmd + K`. Results respect permissions.

Keep important filters visible with an obvious reset. Prefer
URL-backed filter state.

## 21. Responsive UX

Desktop: permanent sidebar, compact tables, side drawers, two-column
overview, horizontal Kanban.

Tablet: collapsible sidebar, reduced padding, hybrid list/table.

Mobile is not shrunk desktop: prioritize My Tasks, Today, task updates,
Upcoming, Notifications, Project Resources. Convert wide tables to
scannable single-column lists. Touch-safe action targets.

## 22. Accessibility

Keyboard navigation, visible focus, semantic HTML, persistent form
labels, accessible dialogs and icon buttons, adequate contrast, logical
heading order, and state communication beyond color. Minimalism never
reduces legibility or touch-target size.

## 23. Login

Restrained split layout on desktop.

Left:
```text
DYNAMATRIX FLOW
Project & Team Workspace
Plan. Collaborate. Deliver.
```
Dark navy with the one allowed gradient accent (§7).

Right: Welcome back, Employee ID, Password, Sign In. No public
registration. First login forces a focused password-change screen with
no workspace access until complete.

## 24. Product UI vs Promotional UI

**Product UI:** flat surfaces, cool neutrals, one restrained accent,
compact information, no decorative illustration, no shadow at rest.

**Promotional assets only:** richer gradients, app-icon glow, larger
type, screenshots, more expressive composition.

Never bring promotional visual language into daily operational screens.

## 25. Avoid Generic SaaS Design Tells

Avoid: four giant KPI cards on every page · icon circles beside every
stat · gradients behind sections · identical rounded cards everywhere ·
giant page titles · excessive empty space · glassmorphism · rainbow
dashboards · random colored borders · unnecessary chart widgets ·
decorative illustrations in operational screens · three-dot menus
hiding important actions · pill-shaped everything · shadow on
resting surfaces · more than four radius values · padding "for
breathing room" with nothing to breathe around.

If it looks like a generic AI-generated dashboard, simplify it further.

## 26. Design Review Checklist

- [ ] Designed for a specific role
- [ ] Most important information is dominant
- [ ] Primary action is obvious
- [ ] Padding matches §1 exactly — nothing larger
- [ ] Zero shadow on any resting surface
- [ ] Radius uses only the four values in §1
- [ ] Only one accent color is visible on this screen
- [ ] Status is not communicated by color alone
- [ ] Button text says exactly what happens
- [ ] Error and empty states are useful
- [ ] Loading state exists and is localized
- [ ] Mobile behavior is intentionally designed
- [ ] Keyboard/focus accessibility works
- [ ] Screen respects RBAC
- [ ] Inaccessible information is not exposed
- [ ] Every card/spacer/badge on the screen earns its place
- [ ] Result feels like Dynamatrix Flow, not a generic admin template

## 27. Final Principle

Dynamatrix Flow should feel like:

> **A focused command center for Dynamatrix Solution's projects and
> team.**

Understandable over impressive. Relevant information over more
information. Better hierarchy over more decoration. Faster interaction
over more animation. Clearer structure over more cards. Less padding,
less color, less shadow, less radius — until removing more would cost
clarity.

The premium feeling comes from **precision, consistency, speed,
hierarchy, and restraint — not decoration.**

## 28. Source-of-Truth Relationship

This skill owns design and UX judgment. It must remain consistent with:

```text
PROJECT_GUIDE.md
UI_GUIDE.md
TECH_STACK.md
DATABASE_SCHEMA.md
RBAC_PERMISSIONS.md
WORKFLOWS.md
ROUTES_AND_PAGES.md
MVP_PLAN.md
TESTING_SECURITY.md
```

Business rules, RBAC, security, database integrity, and documented
workflows remain authoritative. If `UI_GUIDE.md` and this skill differ
on a purely visual detail, update them together so Dynamatrix Flow has
one consistent design language.