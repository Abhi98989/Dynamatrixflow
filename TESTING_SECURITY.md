# DYNAMATRIX FLOW

## Testing & Security Plan

**Company:** Dynamatrix Solution\
**Product:** Dynamatrix Flow\
**Version:** 1.0

## 1. Security Objective

Protect company project data, employee accounts, task history, and
internal research from unauthorized access while keeping the MVP
practical.

Security controls must exist on the server, not only in the interface.

## 2. Authentication Tests

Test:

-   valid Employee ID + password succeeds;
-   invalid ID fails without leaking sensitive detail;
-   wrong password fails;
-   inactive user fails;
-   suspended user fails;
-   first-login user is forced to change password;
-   first-login user cannot bypass `/change-password` by typing another
    URL;
-   changed password works;
-   old temporary password no longer works;
-   password reset invalidates old credential;
-   rate limiting applies to repeated login attempts.

## 3. Password Requirements

Use Argon2id.

Minimum policy should favor reasonable length and prevent obviously weak
passwords without imposing confusing rules.

Never:

-   store plaintext;
-   email/log plaintext automatically without a deliberate secure
    invitation mechanism;
-   expose password hashes;
-   provide "show current password";
-   record passwords in activity metadata.

## 4. Employee Creation Tests

-   only Admin can create employees;
-   generated employee ID is unique;
-   concurrent creation cannot duplicate ID;
-   temporary password is shown only in creation/reset result;
-   DB contains hash, not plaintext;
-   activity log contains event but not password;
-   required fields validated;
-   duplicate email/ID handled cleanly.

## 5. Authorization Matrix Tests

### Admin

Verify Admin can access organization functions.

### Project Lead

Verify Lead can manage Project A if they lead A.

Verify the same Lead cannot manage Project B merely because their system
role is `PROJECT_LEAD`.

### Employee

Verify Employee can access Project A when a member.

Verify Employee cannot access Project B by: - URL; - server action; -
route handler; - search; - guessed task ID; - guessed resource ID.

## 6. IDOR / Direct Object Reference Tests

Attempt to change IDs in URLs and mutation payloads:

``` text
/projects/[otherProject]
/tasks/[otherTask]
/resources/[otherResource]
/team/[otherEmployee]
```

Expected: deny without leaking private data.

This is a critical test category.

## 7. Task Security Tests

-   assignee must be project member;
-   inactive employee cannot receive new task;
-   employee can update own assigned task within allowed transitions;
-   employee cannot reassign task;
-   employee cannot approve own review by default;
-   Lead can review tasks only in led project;
-   Admin can manage all tasks;
-   invalid progress below 0/above 100 rejected;
-   completed task sets correct completion state;
-   blocked state handles blocker reason;
-   every sensitive transition creates history.

## 8. Project Security Tests

-   only Admin creates project in MVP;
-   only Admin changes project lead;
-   Lead manages only led project;
-   removed member loses access;
-   archived project behavior is enforced;
-   internal notes are not exposed to unauthorized users.

## 9. Resource Security Tests

-   only project member can view project resources;
-   project member can add allowed resource;
-   URL protocol validation rejects dangerous schemes;
-   related task must belong to same project;
-   Employee cannot edit another user's resource unless policy permits;
-   Lead/Admin management follows scope;
-   archived resource does not disappear from audit history.

## 10. Input Validation

Use Zod server-side for all mutations.

Test malformed:

-   IDs
-   dates
-   URLs
-   empty titles
-   overlong strings
-   invalid enums
-   invalid progress
-   unexpected fields

Never rely solely on HTML form constraints.

## 11. XSS & Content Safety

User-authored text such as comments, descriptions, notes, and resource
descriptions must render safely.

Avoid raw HTML rendering. If rich text is introduced later, sanitize it
with a reviewed allowlist.

External URLs must use safe protocols and `rel="noopener noreferrer"`
when opening new tabs.

## 12. CSRF / Session Security

Follow Auth.js/Next.js recommended protections.

Production cookies should be:

-   HTTP-only;
-   Secure over HTTPS;
-   appropriate SameSite policy.

Do not expose session tokens to client JavaScript unnecessarily.

## 13. Secrets

Never commit:

``` text
DATABASE_URL
AUTH_SECRET
production API keys
storage secrets
session secrets
```

Commit `.env.example`, not production `.env`.

Rotate a secret immediately if accidentally committed.

## 14. Database Security

-   production DB not publicly open without appropriate controls;
-   least-privilege DB credentials where practical;
-   encrypted connection;
-   backups enabled;
-   migrations reviewed;
-   no development reset command against production;
-   indexes/constraints enforce integrity.

## 15. Activity Log Security

Activity logs must not include:

-   passwords;
-   password hashes;
-   auth tokens;
-   cookies;
-   secrets;
-   unnecessary sensitive payloads.

Activity logs should be append-oriented and not casually editable.

## 16. Unit Tests

Prioritize:

-   permission helpers;
-   allowed task transitions;
-   project progress calculation;
-   overdue/upcoming date classification;
-   employee ID generation;
-   project/task code generation;
-   Zod schemas;
-   URL validation.

## 17. Integration Tests

Cover:

1.  Admin creates employee.
2.  Employee first login/change password.
3.  Admin creates project.
4.  Admin assigns lead.
5.  Lead adds member.
6.  Lead creates/assigns task.
7.  Employee updates task.
8.  Employee submits review.
9.  Lead requests changes.
10. Employee resubmits.
11. Lead completes task.
12. Member adds resource.
13. Unauthorized user is blocked.

## 18. Playwright Critical E2E

Primary scenario:

``` text
Admin Login
→ Create Employee
→ Create Project
→ Assign Lead
→ Add Employee
→ Create Task
→ Logout
→ Employee Login
→ Forced Password Change
→ Open My Tasks
→ Start Task
→ Submit for Review
→ Logout
→ Lead Login
→ Review
→ Complete
```

A second E2E should verify project isolation.

## 19. UI/UX Tests

Verify:

-   loading states;
-   empty states;
-   errors;
-   form validation;
-   mobile navigation;
-   task update on mobile;
-   keyboard navigation;
-   focus visibility;
-   status is not communicated by color alone;
-   dialogs have accessible names.

## 20. Performance Checks

Before launch:

-   avoid N+1 project/task queries;
-   paginate activity/notifications;
-   index common filters;
-   do not load all organization history at once;
-   inspect slow dashboard queries;
-   select only needed fields.

## 21. Production Preflight

Run:

``` text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also verify:

-   environment variables;
-   HTTPS;
-   production database;
-   migration status;
-   backups;
-   seed credentials absent;
-   no debug endpoints;
-   no secrets in repository;
-   admin account secured;
-   rate limiting active;
-   error messages do not expose stack traces to users.

## 22. Security Regression Rule

Any new feature that introduces a new entity or mutation must answer:

1.  Who can view it?
2.  Who can create it?
3.  Who can edit it?
4.  Who can delete/archive it?
5.  What project scope applies?
6.  What validation applies?
7.  What activity should be logged?
8.  What notification should be created?
9.  What tests prove unauthorized users are blocked?

If these are unanswered, the feature is not ready.
