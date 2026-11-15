# Implementation plan

Sources read: official three-page assessment and PlantHelper ARCHITECTURE.md.

## Mandatory behavior

Staff authenticate, select patients/exams, schedule, filter, cancel, save/edit drafts and publish. Patients see only their appointments and published reports. One room, aligned 30-minute slots, no past bookings, cancelled slots reusable. UTC storage and America/Sao_Paulo interpretation/display. One report per appointment; publication is immutable; cancellation and publication must serialize.

## Milestones

- [x] Read sources and extract requirements.
- [x] Foundation: npm workspaces, strict TS, shared schemas, design tokens.
- [x] API: hashed credentials, database sessions, origin protection, role/ownership authorization.
- [x] Database: versioned migration, partial slot uniqueness, seed, transactional row locks.
- [x] Reports: draft, edit, publish, visibility and cancellation invariants.
- [x] UI: login, staff/patient workflows, validation, states and confirmations.
- [x] Tests: real PostgreSQL concurrent scheduling; ownership, draft secrecy, publication, past dates; adjacent invariants; pure logic and UI tests.
- [x] Verification: clean migration/seed, typecheck, lint, tests, builds, self-review, documentation.

## Decisions and verification

- Requested stack, feature-specific database functions, no DI container. Same-origin Vite proxy; strict Origin policy for mutations. No invented opening hours.
- Partial unique index arbitrates booking races. Row locks serialize report writes, publication and cancellation.
- Source restored after requested rollback. All application files remain inside this new project folder.
- Final checks: strict TypeScript, lint, 8 unit/UI tests, 13 real PostgreSQL integration tests, frontend/API production builds and formatting.
- Browser walkthrough: staff schedule/draft/edit/publish/cancel; patient reads own published report; another patient receives 404; 390px layout without overflow; clinic timezone preserved in a browser configured for Los Angeles.
- Clean-copy npm ci and verification recorded in TESTING.md.
- Docker Desktop could not launch here. Real PostgreSQL 18.6 ran temporarily for verification. Compose specifies PostgreSQL 17; the Compose startup itself was not executed.
- No mandatory feature remains pending. External hosting and email submission are outside this local delivery.
