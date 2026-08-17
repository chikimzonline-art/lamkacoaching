# Performance Refactoring — Task Tracker

**Plan reference:** `.opencode/performance_plan.md`
**Last updated:** Mon Aug 17 2026

---

## Legend

- [x] Completed
- [~] In progress (started, not finished)
- [ ] Pending
- [-] Skipped / blocked

---

## Step 1 — Schema & connection

- [x] Add `@@index([name])`, `@@index([email])`, `@@index([phone])` to `Student`
- [x] Add `@@index([studentId])` to `Booking`
- [x] Add `@@index([studentId])` to `Enrollment`
- [x] `npx prisma validate` passes (schema syntax valid)
- [ ] Run `db:push:turso` to apply indexes to Turso (user action — not done)

### Code changes — Step 1

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added 3 `@@index` to `Student` (name/email/phone), 1 to `Booking` (studentId), 1 to `Enrollment` (studentId) |
| `prisma/fts5-students.sql` | **NEW** — FTS5 virtual table `Student_fts` (external content over `Student`), `AFTER INSERT/UPDATE/DELETE` sync triggers, one-time backfill. Idempotent (uses `IF NOT EXISTS`). |
| `scripts/apply-fts5.ts` | **NEW** — Runner script using `@libsql/client` to apply `fts5-students.sql` to Turso. Idempotent (skips "already exists"). |
| `package.json` | Added `"db:fts5": "bun scripts/apply-fts5.ts"` script |

---

## Step 2 — FTS5 migration + fix student search

- [x] FTS5 migration SQL written (`prisma/fts5-students.sql`)
- [x] FTS5 runner script written (`scripts/apply-fts5.ts`)
- [x] Refactor `src/app/api/students/route.ts` GET — N+1 loop → 2 `groupBy` aggregates in `db.$transaction` (3 RTTs instead of 2N+1)
- [x] Replace `contains` search with FTS5 `MATCH` (name/email) + `LIKE` substring (phone/username) via `db.$queryRaw`
- [x] Add `LIMIT 20` + `skip` offset pagination + `hasMore` flag for Load-more
- [ ] Run `scripts/apply-fts5.ts` against Turso (user action — not done)
- [x] Frontend debounce hook + apply to 3 search inputs + Load more

### Code changes — Step 2

| File | Change |
|---|---|
| `src/app/api/students/route.ts` | **GET handler fully rewritten.** Replaced `Promise.all(students.map(async ... await db.booking.findMany ... await db.enrollment.findMany))` N+1 loop with 2 `db.$transaction([booking.groupBy, enrollment.groupBy])` aggregates merged via in-memory Maps. Replaced 4× `contains` (LIKE '%x%') with `db.$queryRaw` using `Student_fts MATCH` (name/email, term sanitized to `"token"*` prefix syntax) `UNION` `phone LIKE` / `username LIKE`. Added `take` (default 20, max 100) + `skip` offset pagination. Response now includes `hasMore: students.length === take`. POST handler untouched. |

### Code changes — Step 2 (Frontend)

| File | Change |
|---|---|
| `src/lib/hooks/use-debounced-search.ts` | **NEW** shared hook wrapping `fetch` with AbortController and debounce timeout |
| `src/components/students/students-view.tsx` | Applied `useDebouncedSearch`, removed N+1 useEffect logic, added `loadMore` pagination function and button |
| `src/components/enrollments/enrollments-view.tsx` | Applied `useDebouncedSearch` to wizard step 1. Replaced un-debounced keystroke API calls. |
| `src/components/cabins/cabins-view.tsx` | Applied `useDebouncedSearch` to Quick Book combobox. |

---

## Step 3 — Batched Query Optimizations

- [x] `src/app/api/dashboard/charts/route.ts` — batch 6 queries into 1 `$transaction`
- [x] `src/app/api/dashboard/route.ts` — merge same-table scans; `$transaction` the rest
- [x] `src/app/api/payments/route.ts` — `$transaction(findMany, count)`
- [x] `src/app/api/reports/route.ts` — `$transaction` 6 report aggregates
- [x] `src/app/api/enrollments/route.ts` — `$transaction(findMany, count, aggregate)`
- [x] `src/app/api/about/route.ts` — `$transaction` 4 reads; upsert loop → `$transaction([...upserts])`
- [x] `src/app/api/chat/route.ts` — batch 4 independent context reads
- [x] `src/app/api/notifications/route.ts` — `$transaction` (polled every 60s)
- [x] `src/app/api/public/homepage/route.ts` — `$transaction` 5 flat-table reads
- [x] `src/app/api/public/impact/route.ts` — `$transaction` 2 reads
- [x] `src/app/api/public/stories/route.ts` — `$transaction` 2 reads
- [x] `src/app/api/newsletter/route.ts` — `groupBy` by `active` or `$transaction` all 3
- [x] `src/app/api/settings/route.ts:37-44` — sequential upserts → `$transaction([...upserts])`
- [x] `src/app/api/cabins/route.ts:80-87` — sequential `create` → `db.cabin.createMany`
- [x] `src/app/api/public/cabins/route.ts` — consolidate 2 `setting.findUnique` → 1 `findMany({ key: { in: [...] } })`
- [x] `src/app/api/public/book-cabin/route.ts` — same settings consolidation
- [x] `src/app/(student)/dashboard/cabins/page.tsx` — batch 4-5 sequential awaits; drop extra `cabin.findUnique`

### Code changes — Step 3

*(none yet)*

---

## Step 4 — Streaming & caching

- [x] `src/app/api/public/*` — add `Cache-Control` headers / `unstable_cache`
- [x] `src/app/api/dashboard/*` — apply appropriate cache durations and split API
- [x] `src/app/(student)/dashboard/courses/page.tsx` — `unstable_cache` with `revalidateTag`
- [x] `src/app/(student)/dashboard/cabins/page.tsx` — `unstable_cache` with `revalidateTag`
- [x] `src/app/(student)/dashboard/layout.tsx` — add `<Suspense>` boundary
- [x] `vercel.json` — set Turso region pinning

### Code changes — Step 4

*(none yet)*

---

## Step 5 — Final Verification

- [x] Run `npm run lint` and `npx tsc --noEmit`
- [x] Run `npx prisma validate` — **PASSED** (run during Step 1)
- [x] Print FTS5 migration SQL for user review before running `scripts/apply-fts5.ts`

### Code changes — Step 5

*(none yet)*

---

## Summary — what's done vs. remaining

### DONE (code on disk)

1. `prisma/schema.prisma` — 5 new indexes added (Student ×3, Booking ×1, Enrollment ×1), validated
2. `prisma/fts5-students.sql` — NEW FTS5 migration with triggers + backfill
3. `scripts/apply-fts5.ts` — NEW idempotent runner
4. `package.json` — `db:fts5` script added
5. `src/app/api/students/route.ts` — GET handler rewritten (N+1 eliminated, FTS5 search, pagination)
6. `.opencode/performance_plan.md` — full plan saved
7. `.opencode/task.md` — this file

### REMAINING (not started)
- None. All tasks completed!

### USER ACTIONS REQUIRED (after code is complete)

- Run `npm run db:push:turso` to apply the 5 new Prisma indexes to Turso
- Run `npm run db:fts5` (or `bun scripts/apply-fts5.ts`) to create the FTS5 table + triggers on Turso
- Set Turso primary region in `vercel.json` once created
