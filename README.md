# Dynamatrix Flow

**Dynamatrix Flow** is an enterprise-grade Project & Team Workspace management system built for high-performing engineering and product teams. It combines project lifecycles, Kanban task tracking, milestone tracking, team allocation, resource hubs, and real-time activity auditing into a unified, minimalist interface.

---

## ⚡ Core Features

- **Dashboard**: High-level attention metrics, active project cards, urgent deadlines, and recent activity.
- **Projects**: Comprehensive project management with dual Table/Grid views, filtering by lead, priority, and status.
- **Project Detail Suite**:
  - **Overview**: Real-time progress bars, budget allocation, team leads, and recent tasks.
  - **Tasks & Kanban Board**: Interactive board with drag/status progression (To Do, In Progress, Blocked, In Review, Completed).
  - **Milestones**: Deliverable milestones with deadline tracking and progress metrics.
  - **Team**: Member management, leadership assignment, and instant team member invitation modal.
  - **Resources**: Centralized project assets, documentation, APIs, design files, and repositories.
  - **Activity Timeline**: Full chronological audit log with actor avatars and timestamped state transitions.
  - **Settings**: Project configuration, lead reassignment, budget management, and project status controls.
- **Upcoming Schedule**: Unified timeline organizing tasks, milestones, and project deadlines into urgency buckets (*Overdue*, *Today*, *Tomorrow*, *This Week*, *Later*).
- **Team Directory**: Company-wide employee directory with live workload balancing (active task count & project allocation), search, and role-based actions.
- **Resource Hub**: Global searchable repository for engineering documentation, designs, and external tools.
- **Notifications**: Notification bell dropdown with unread badge counters, instant mark-as-read, and dedicated notifications inbox.
- **Profile & Settings**: User profile editing, secure password management, and workspace display preferences.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- **UI & React**: React 19, [Tailwind CSS](https://tailwindcss.com/), Radix UI primitives, Lucide Icons
- **Design System**: Dynamatrix Minimalist UX (0 resting shadows, strict 4px spacing scale, `#0B1020` Dark Navy & `#5B5FEF` Indigo accents)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Role-based access control (`ADMIN`, `PROJECT_LEAD`, `EMPLOYEE`) with iron-clad session guards
- **Code Quality**: ESLint 9 (`--max-warnings=0`), TypeScript 6 (`strict` mode)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 24 LTS
- PostgreSQL database
- pnpm 12.6.0 (or npm)

### 2. Environment Setup
Copy the example environment file and configure your local PostgreSQL connection:
```bash
cp .env.example .env.local
```
Update `.env.local` with your database credentials:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dynamatrixflow"
AUTH_SECRET="your-secure-random-secret"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Dynamatrix Flow"
```

### 3. Database Migration & Seeding
```bash
npx prisma db push
# Or run Prisma migrations
npx prisma migrate dev
```

### 4. Running the Development Server
```bash
npm run dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Production Quality Verification

Run the full verification suite to confirm production readiness:

```bash
# Type check with 0 errors
npx tsc --noEmit

# Lint check with 0 warnings
npm run lint

# Production build and optimization
npm run build
```

---

## 📦 Hosting on GitHub

To publish this repository to GitHub:

1. Initialize git (if not already done) and stage all production files:
```bash
git add .
```

2. Create your initial commit:
```bash
git commit -m "feat: initial production release of Dynamatrix Flow"
```

3. Link your remote repository and push:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_ORGANIZATION_OR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

> **Note**: Sensitive credentials and environment configurations (`.env*`) are strictly excluded by `.gitignore`. Only `.env.example` is committed.
- [shadcn/ui manual setup](https://ui.shadcn.com/docs/installation/manual)