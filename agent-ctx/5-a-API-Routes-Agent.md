# Task 5-a: API Routes Agent

## Task
Create API routes for impact stats, achievement cards, success stories, testimonials

## Files Created
1. `/src/app/api/impact-stats/route.ts` — GET + POST (admin, auth required)
2. `/src/app/api/impact-stats/[id]/route.ts` — PUT + DELETE (admin, auth required)
3. `/src/app/api/achievement-cards/route.ts` — GET + POST (admin, auth required)
4. `/src/app/api/achievement-cards/[id]/route.ts` — PUT + DELETE (admin, auth required)
5. `/src/app/api/success-stories/route.ts` — GET + POST (admin, auth required)
6. `/src/app/api/success-stories/[id]/route.ts` — PUT + DELETE (admin, auth required)
7. `/src/app/api/testimonials/route.ts` — GET + POST (admin, auth required)
8. `/src/app/api/testimonials/[id]/route.ts` — PUT + DELETE (admin, auth required)
9. `/src/app/api/public/impact/route.ts` — GET (public, no auth, returns active impactStats + achievementCards)
10. `/src/app/api/public/stories/route.ts` — GET (public, no auth, returns active successStories + testimonials)

## Patterns Used
- Auth: inline `getAuthUser()` helper using `cookies()` + `verifyToken()` (consistent with existing about/students/departments routes)
- CRUD: Same pattern as `/api/faqs` route — findMany with orderBy, create with defaults, update with spread operator for partial updates, delete by id
- Public: Same pattern as `/api/public/faqs` — filter by active=true, return empty arrays on error
- Error handling: try/catch with console.error and NextResponse.json error responses

## Verification
- Lint: No errors in new files
- Public endpoints tested: /api/public/impact returns `{"impactStats":[],"achievementCards":[]}`
- Public endpoints tested: /api/public/stories returns `{"successStories":[],"testimonials":[]}`
- Admin endpoints tested: return 401 Unauthorized without auth
- Prisma Client regenerated with `bun run db:push`
