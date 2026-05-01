# Task 3-a and 3-b — Newsletter Admin & Dark Mode Agent

## Task Summary
Add Newsletter Subscriber Admin view and fix dark mode on subpages (cabins, register, computer-training).

## Work Completed

### Part 1: Newsletter Admin

1. **GET endpoint** added to `/src/app/api/newsletter/route.ts`
   - Paginated subscriber list (default 20/page)
   - Search by email (case-insensitive)
   - Returns: subscribers[], total, page, totalPages, activeCount

2. **DELETE/PATCH endpoint** at `/src/app/api/newsletter/[id]/route.ts`
   - PATCH: Toggle active/inactive status
   - DELETE: Remove subscriber by ID

3. **NewsletterView component** at `/src/components/newsletter/newsletter-view.tsx`
   - Stats cards (total, active, inactive)
   - Search with debounce
   - Desktop table + mobile card views
   - Switch toggle for active status
   - Delete with confirmation dialog
   - Export emails to clipboard
   - Pagination

4. **Store updated** at `/src/store/app-store.ts`
   - Added 'newsletter' to ViewType

5. **Admin page updated** at `/src/app/admin/page.tsx`
   - Dynamic import for NewsletterView
   - Nav items in both moreNavItems and allSidebarItems
   - viewTitles entry
   - renderView case

6. **Footer verified** — already connected to POST `/api/newsletter`

### Part 2: Dark Mode Fixes

1. **PublicLayout** — `bg-white` → `bg-white dark:bg-gray-900`
2. **Cabins page** — Fixed error text missing dark variant
3. **Register page** — Fixed enrolled course name, fee, browse button, no-courses text
4. **Homepage** — Fixed FAQ/Programs/notice badges and skill tags
5. **Computer-training** — Intentionally dark, no changes needed

## Files Modified
- `/src/app/api/newsletter/route.ts` (added GET)
- `/src/app/api/newsletter/[id]/route.ts` (new: PATCH + DELETE)
- `/src/components/newsletter/newsletter-view.tsx` (new)
- `/src/store/app-store.ts` (added 'newsletter' to ViewType)
- `/src/app/admin/page.tsx` (added import, nav items, viewTitles, renderView)
- `/src/components/public/public-layout.tsx` (dark bg)
- `/src/app/cabins/page.tsx` (dark mode fix)
- `/src/app/register/page.tsx` (dark mode fixes)
- `/src/app/page.tsx` (dark mode fixes on badges)

## Verification
- Lint passes with no new errors (42 pre-existing in studyspace only)
- All API routes use proper error handling and Prisma client
