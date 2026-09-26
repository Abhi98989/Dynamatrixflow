# Phase 2 — Authentication & Security

## Completed

- Configured Auth.js v5 (NextAuth `5.0.0-beta.32`) with JWT session handling and `trustHost: true`.
- Built employee credentials authentication using `employeeId` + `password` with case-insensitive matching.
- Implemented Argon2id password verification (`@node-rs/argon2`).
- Enforced account status checks (`ACTIVE`, `INACTIVE`, `SUSPENDED`) preventing deactivated accounts from authenticating or accessing workspace resources.
- Implemented sliding-window rate limiting on login attempts to mitigate brute-force attacks.
- Created `/login` page and interactive `LoginForm` using Dynamatrix design tokens, accessible alerts, and no public registration.
- Implemented server workspace session guard in `src/app/(workspace)/layout.tsx` with fresh DB status validation (ensuring instant revocation if accounts are deactivated or passwords reset).
- Implemented `mustChangePassword` guard intercepting users on first login and redirecting them to `/change-password`.
- Created `/change-password` page and interactive `ChangePasswordForm` validating 8+ character length, password confirmation, Argon2id re-hashing, and activity logging (`PASSWORD_RESET`).
- Created centralized server-side authorization helpers in `src/server/auth/authorization.ts` enforcing RBAC (`requireAuthenticatedUser`, `requireActiveUser`, `requireAdmin`, `canViewProject`, `canManageProject`, `canManageMembers`, `canCreateTask`, `canUpdateTask`, `canReviewTask`, `canManageResource`, and `isAllowedStatusTransition`).
- Added sign-out functionality in topbar user account popover.
- Auth tests added in `tests/phase2-auth.test.mjs` and Playwright E2E in `tests/browser/auth-flow.spec.ts`.

## Files Changed / Created

- `package.json`: added `next-auth`, `zod`, and updated test scripts.
- `src/types/next-auth.d.ts`: strict TypeScript session and JWT module augmentations.
- `src/server/auth/rate-limit.ts`: in-memory sliding window rate limiter.
- `src/server/auth/config.ts`: Auth.js options, Credentials provider, JWT and session callbacks, and `authenticateUser` helper.
- `src/server/auth/index.ts`: NextAuth initialization and `getCurrentUser()` helper.
- `src/server/auth/authorization.ts`: centralized server authorization helpers for RBAC and project scoping.
- `src/server/auth/actions.ts`: `loginAction`, `changePasswordAction`, `logoutAction`.
- `src/app/api/auth/[...nextauth]/route.ts`: App Router NextAuth API endpoints.
- `src/components/ui/input.tsx`: accessible form input styled with Dynamatrix tokens.
- `src/components/ui/label.tsx`: accessible form label.
- `src/components/ui/card.tsx`: added `CardDescription` export.
- `src/components/layout/topbar.tsx`: added session user display and sign-out form.
- `src/features/auth/login-form.tsx`: client login component with action state.
- `src/features/auth/change-password-form.tsx`: client password change component.
- `src/app/(auth)/layout.tsx`: centered authentication layout.
- `src/app/(auth)/login/page.tsx`: login page.
- `src/app/(auth)/change-password/page.tsx`: forced password change page.
- `src/app/(workspace)/layout.tsx`: server-side session, account status, and `mustChangePassword` guard.
- `playwright.config.ts`: loaded `.env.local` and set webServer url to `/login`.
- `tests/foundation.test.mjs`: verified unauthenticated redirect to `/login` and login security headers.
- `tests/browser/workspace.spec.ts`: updated desktop and mobile tests to authenticate as Admin before asserting shell.
- `tests/browser/auth-flow.spec.ts`: verified first-login forced password change, workspace bypass prevention, and post-change access.
- `tests/phase2-auth.test.mjs`: comprehensive unit and authorization helper tests.
- `MVP_PLAN.md`: marked Phase 2 items complete.
- `PHASE_2_REPORT.md`: documentation of Phase 2 implementation.

## Security Controls

- Passwords verified with Argon2id.
- Plaintext passwords never logged or stored.
- Rate limiting active on login attempts (5 attempts / 15m window).
- Server-side guard prevents direct URL bypass to `/dashboard` without authentication or when `mustChangePassword` is true.
- Account status verified against database on every workspace request, enabling instantaneous session revocation when deactivated.
- Project scoping and RBAC enforced in `authorization.ts`.

## Validation Results

- `pnpm lint`: passed (0 warnings, 0 errors).
- `pnpm typecheck`: passed (0 errors).
- `pnpm build`: passed (optimized production build in 1.7s).
- `pnpm test`: all 14 unit and integration tests passed.
- `pnpm test:ui`: all 3 Playwright browser tests passed.
- `pnpm format:check`: all files formatted cleanly.

## Next Phase

Phase 3 — Employee Management (Admin Team page, Add Employee form, unique `DMS-###` ID generation, secure temporary password generation displayed once, employee profile, activate/deactivate/suspend, admin password reset, employee search/filter).
