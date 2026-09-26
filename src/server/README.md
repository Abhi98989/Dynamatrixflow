# Server boundaries

Phase 0 contains no authentication, database queries, or mutations.

Phase 1 introduces Prisma under `db/`. Phase 2 adds centralized authentication and authorization under `auth/`. Later business logic belongs under `services/` and must validate account status, project scope, ownership, and workflow state before database access. Never import secret-bearing server modules into Client Components.
