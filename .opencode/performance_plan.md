# Performance Refactoring Plan — Lamka Coaching Center

**Stack:** Next.js (App Router) + Prisma + `@prisma/adapter-libsql` (Turso/libSQL) + QStash + ImageKit + Razorpay, hosted on Vercel.

**Date created:** Mon Aug 17 2026

---

## 1. Stack Clarification (important)

The app queries Turso **through Prisma** (`src/lib/db.ts:17`), not raw `@libsql/client` (which is only used in migration scripts). This shapes the toolset:

- **Batching** → `db.$transaction([...])`. With the libSQL adapter, an array-transaction is sent as **one batched HTTP request** — the Prisma equivalent of `client.batch()`.
- **FTS5** → Prisma cannot declare virtual tables in `schema.prisma`, so the FTS5 table + sync triggers live in a raw SQL migration applied via a new runner script (extending the `scripts/turso-migrate.ts` pattern). App queries use `db.$queryRaw` with `MATCH`.
- **JOINs** → already used well in many routes via Prisma `include`/`select`.

**Auth constraint:** `getAuthUser` (`src/lib/auth.ts`) uses `next-auth`'s `getServerSession`, which is Node-only. Therefore the student search API **cannot** be `runtime = 'edge'`. We will use region-pinned Node instead, and add `vercel.json` region guidance.

---

## 2. Files Analyzed

| Area | Files |
|---|---|
| Schema / DB | `prisma/schema.prisma`, `src/lib/db.ts`, `scripts/turso-migrate.ts`, `prisma.config.ts`, `package.json`, `next.config.ts` |
| Student search backend | `src/app/api/students/route.ts` |
| Student search frontend | `src/components/students/students-view.tsx`, `src/components/enrollments/enrollments-view.tsx`, `src/components/cabins/cabins-view.tsx`, `src/components/payments/payments-view.tsx` |
| N+1 / multi-RTT hotspots | `src/app/api/dashboard/route.ts`, `dashboard/charts/route.ts`, `payments/route.ts`, `reports/route.ts`, `enrollments/route.ts`, `about/route.ts`, `chat/route.ts`, `notifications/route.ts`, `settings/route.ts`, `cabins/route.ts`, `public/homepage/route.ts`, `public/impact/route.ts`, `public/stories/route.ts`, `public/cabins/route.ts`, `public/book-cabin/route.ts`, `newsletter/route.ts` |
| Streaming / caching targets | `src/app/admin/page.tsx`, `src/components/dashboard/dashboard-view.tsx`, `src/app/(student)/dashboard/courses/page.tsx`, `src/app/(student)/dashboard/cabins/page.tsx`, `src/app/(student)/dashboard/layout.tsx` |

---

## 3. Bottlenecks Found (ranked by severity)

### CRITICAL — true N+1 (the real cause of the 3s search latency)

**`src/app/api/students/route.ts:40-69`** runs `2N` separate Prisma round-trips — one `booking.findMany` + one `enrollment.findMany` **per student** — wrapped in `Promise.all`. With ~100 results that's ~200 HTTP calls to Turso. `Promise.all` makes them concurrent, but each still pays full HTTP RTT. The `contains` (LIKE '%x%') full-table scan on 4 columns at lines 18-25 is a **secondary** contributor, not the main one.

### HIGH — admin dashboard 15-query fanout

**`src/app/api/dashboard/route.ts:38-117`** fires 15 separate Prisma calls in one `Promise.all`. Several scan the same `Booking`/`Payment` tables with overlapping filters (could be merged); the rest should be batched via `$transaction`.

### HIGH — enrollment wizard has ZERO debounce + no AbortController

**`src/components/enrollments/enrollments-view.tsx:156-158`** fires a request on **every keystroke**. The other two search boxes have 300ms/500ms `setTimeout` debounce, but none use `AbortController`, so slow in-flight requests pile up and the last-resolving one wins.

### MEDIUM — sequential `await` chains (serialized RTTs)

- `payments/route.ts` (2 serialized full scans)
- `reports/route.ts` (2 serialized full scans)
- `about/route.ts` (4 serialized reads + upsert loop)
- `chat/route.ts` (6 sequential reads per message)
- `enrollments/route.ts` (3 serialized reads)
- `src/app/(student)/dashboard/cabins/page.tsx` (4-5 sequential awaits, no batching)
- `notifications/route.ts` (2 serialized, polled every 60s × every student)

### MEDIUM — write N+1 loops

- `settings/route.ts:37-44` — sequential `upsert` per key
- `about/route.ts:73-80` — identical upsert loop
- `cabins/route.ts:80-87` — sequential `create` per cabin in bulk-add

### MEDIUM — missing indexes

- `Student` has **no** `@@index` on `name` / `email` / `phone`
- `Booking` has **no** index on `studentId`
- `Enrollment` has **no** index on `studentId`

(Hurts grouped aggregates and all per-student lookups.)

### MEDIUM — no caching / streaming anywhere

Codebase-wide: `unstable_cache`, `revalidateTag`, `force-cache`, `next:{revalidate}`, and route-segment `revalidate`/`dynamic` — **zero usage**. `<Suspense>` only on login. Explore Courses and Explore Cabin are Server Components that block fully on uncached, unbatched awaits. `next.config.ts` has no caching config. The admin dashboard is already client-rendered with skeleton fallbacks (not a blocking RSC).

---

## 4. Confirmed Decisions

| Decision point | Chosen |
|---|---|
| Phone / username search | **Keep substring match** — `contains` (LIKE '%x%') for phone + username. Stays a scan but on ≤20 rows after the limit + new studentId indexes. No UX change. |
| Search result limit | **Cap at 20 + Load more** — `LIMIT 20` on FTS query, infinite-scroll control. |
| Admin dashboard streaming | **Split API into parallel endpoints** — break `/api/dashboard` into 3-4 smaller endpoints; `dashboard-view.tsx` fires them in parallel, each card skeleton fills independently. Low risk, keeps client architecture. |
| Cache revalidate windows | **Courses 5m / Cabins 1m** — `unstable_cache` with `revalidate: 300` (tag `courses`) and `revalidate: 60` (tag `cabins`). `revalidateTag` fires on mutations. |
| Edge proximity | **Region guidance only** — add `vercel.json` region template. Search stays on Node runtime (auth is Node-only via `next-auth`). |

---

## 5. Implementation Plan

### Step 1 — Schema & connection

- `prisma/schema.prisma`:
  - `Student`: add `@@index([name])`, `@@index([email])`, `@@index([phone])`
  - `Booking`: add `@@index([studentId])`
  - `Enrollment`: add `@@index([studentId])`
- Apply via existing `db:push:turso` (raw SQL migration is separate, see Step 2).
- Keep Prisma + adapter + lazy Proxy singleton as-is (already correct).

### Step 2 — FTS5 migration + fix student search

**New files:**

- `prisma/fts5-students.sql` —
  ```sql
  CREATE VIRTUAL TABLE IF NOT EXISTS Student_fts USING fts5(
    name, email, content='Student', content_rowid='rowid'
  );
  -- AFTER INSERT
  CREATE TRIGGER IF NOT EXISTS Student_ai AFTER INSERT ON Student BEGIN
    INSERT INTO Student_fts(rowid, name, email) VALUES (new.rowid, new.name, new.email);
  END;
  -- AFTER UPDATE (name/email changed)
  CREATE TRIGGER IF NOT EXISTS Student_au AFTER UPDATE ON Student WHEN new.name != old.name OR new.email != old.email BEGIN
    DELETE FROM Student_fts WHERE rowid = old.rowid;
    INSERT INTO Student_fts(rowid, name, email) VALUES (new.rowid, new.name, new.email);
  END;
  -- AFTER DELETE
  CREATE TRIGGER IF NOT EXISTS Student_ad AFTER DELETE ON Student BEGIN
    DELETE FROM Student_fts WHERE rowid = old.rowid;
  END;
  -- One-time backfill
  INSERT INTO Student_fts(rowid, name, email) SELECT rowid, name, email FROM Student
  WHERE rowid NOT IN (SELECT rowid FROM Student_fts);
  ```

- `scripts/apply-fts5.ts` — idempotent runner (reuses the `turso-migrate.ts` pattern, skips "already exists").

**Refactor `src/app/api/students/route.ts` (GET):**

- Search: one `db.$queryRaw` —
  ```sql
  SELECT * FROM Student
  WHERE rowid IN (SELECT rowid FROM Student_fts WHERE Student_fts MATCH ?)
  UNION
  SELECT * FROM Student WHERE phone LIKE ? OR username LIKE ?
  LIMIT 20 OFFSET ?
  ```
  FTS5 term sanitized to `token*` prefix syntax. Fallback to `findMany` when no search term.

- Balance: replace `Promise.all(students.map(...))` loop with **2 `groupBy` aggregates** (`booking.groupBy` + `enrollment.groupBy` over `studentId IN [...]`), merged in memory → **3 RTTs** instead of `2N+1`.

- Add `take`/`offset` pagination for Load-more.

**Frontend — new shared hook `src/lib/hooks/use-debounced-search.ts`:**

- 300ms debounce + `AbortController` (cancels in-flight on new keystroke) + min-2-char guard.
- Apply to:
  - `students-view.tsx` (add "Load more" button)
  - `enrollments-view.tsx` (currently zero debounce — the worst offender)
  - `cabins-view.tsx`

### Step 3 — Eradicate N+1 / multi-RTT (batch via `db.$transaction`)

- `src/app/api/dashboard/route.ts` — merge same-table `Booking`/`Payment` scans; batch the rest with `$transaction`. (Also split in Step 4.)
- `dashboard/charts/route.ts` — batch 3 reads via `$transaction`.
- `payments/route.ts` — `Promise.all` → `$transaction`.
- `reports/route.ts` — `Promise.all` → `$transaction`.
- `enrollments/route.ts` — `Promise.all` → `$transaction`; merge count + aggregate into one `aggregate({_count, _sum})`.
- `about/route.ts` — `$transaction` 4 reads; upsert loop → `$transaction([...upserts])`.
- `chat/route.ts` — batch the 4 independent context reads via `$transaction`.
- `notifications/route.ts` — `$transaction` (polled frequently).
- `public/homepage|impact|stories/route.ts` — `$transaction` batch independent flat-table reads.
- `newsletter/route.ts` — `groupBy` by `active`, or `$transaction` all 3.
- `settings/route.ts:37-44` — sequential upserts → `db.$transaction([...upserts])`.
- `cabins/route.ts:80-87` — sequential `create` → `db.cabin.createMany(...)`.
- `public/cabins/route.ts` + `public/book-cabin/route.ts` — consolidate two `setting.findUnique` calls into one `findMany({ key: { in: [...] } })`.
- `src/app/(student)/dashboard/cabins/page.tsx` — batch the 4-5 sequential awaits; reuse the already-included `booking.cabin` to drop the extra `cabin.findUnique`.

### Step 4 — Streaming & caching

**Admin dashboard (split API, parallel skeletons):**

- Split `src/app/api/dashboard/route.ts` into:
  - `route.ts` — core stats (merged, batched)
  - `charts/route.ts` — already exists
  - `recent/route.ts` — recent payments + enrollment payments + pending bookings
- `dashboard-view.tsx` — fire the 3 endpoints in parallel with `Promise.all`, each card group skeleton fills independently. Keeps client architecture (low risk).

**Student Explore pages (caching):**

- `src/app/(student)/dashboard/courses/page.tsx` — wrap `db.course.findMany` in `unstable_cache` keyed by student id, `revalidate: 300`, `tags: ['courses']`.
- `src/app/(student)/dashboard/cabins/page.tsx` — wrap cabin query in `unstable_cache`, `revalidate: 60`, `tags: ['cabins']`.
- Add `revalidateTag('courses')` to `courses/actions.ts` mutations and `revalidateTag('cabins')` to `cabins/actions.ts` mutations (alongside existing `revalidatePath`).
- `src/app/(student)/dashboard/layout.tsx` — wrap `{children}` in `<Suspense>` so pages stream.
- Add `Cache-Control` headers to `api/public/courses`, `public/cabins`, `public/impact`, `public/stories` routes.

**Edge proximity (config):**

- New `vercel.json` — region template with a comment to set your Turso primary region (e.g. `sin1` / `bom1`). Pin Node functions to the same region as the Turso primary to minimize base RTT.

### Verification after writing

- Run `npm run lint` and `npx tsc --noEmit` (TypeScript check).
- Run `npx prisma validate` on the schema.
- Print the FTS5 migration SQL for your review before you run `scripts/apply-fts5.ts` against Turso.

---

## 6. Execution Order (todo)

1. Schema indexes + FTS5 migration SQL/script
2. Fix students API: N+1 → groupBy + FTS5 search + limit 20
3. Frontend: `useDebouncedSearch` + apply to 3 search inputs + Load more
4. Batch multi-RTT routes via `$transaction` + fix write loops
5. Dashboard API split + `dashboard-view` parallel fetch
6. Explore Courses/Cabins `unstable_cache` + `<Suspense>` + `revalidateTag`
7. `vercel.json` regions + region-pin Node functions
8. Lint / typecheck verification

---

## 7. Notes & Caveats

- `next-auth` session lookup (`getServerSession`) is Node-only → search route stays on Node. Edge runtime is **not** applied to `/api/students`.
- FTS5 is created via raw SQL because Prisma schema cannot declare virtual tables. Triggers auto-sync `Student_fts` on INSERT/UPDATE/DELETE of `Student`.
- Phone + username intentionally stay on `LIKE '%x%'` (substring) — FTS5 is poor for numeric substrings. Scan cost is acceptable on ≤20 post-limit rows.
- `db.$transaction([...])` with the libSQL adapter batches reads/writes into a **single HTTP request** — this is the Prisma equivalent of raw `client.batch()`.
- `unstable_cache` is used (not `use cache` / PPR) because the project is on Next 16 and `unstable_cache` is the stable, well-understood primitive here.
- Admin dashboard "streaming" is achieved by splitting the API and firing parallel client fetches — **not** by converting `dashboard-view.tsx` to a Server Component (would be high-risk given its 773-line client impl with charts/Razorpay/confetti).

---

## 8. Status

- [x] Audit complete
- [x] Plan confirmed by user
- [ ] Code written
- [ ] Migrations applied
- [ ] Lint/typecheck passing
