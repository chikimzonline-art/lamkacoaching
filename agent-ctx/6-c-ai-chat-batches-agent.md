# Task 6-c: AI Chat Widget & Admin-Managed Batches

## Agent: AI Chat Widget & Admin Batches Agent

## Status: COMPLETED

## Summary
Implemented two major features:
1. **AI Chat Widget** — Floating chat widget using z-ai-web-dev-sdk for intelligent coaching center assistant
2. **Admin-Managed Batches** — Database-driven batch management system replacing hardcoded data

## Files Created
- `/src/app/api/chat/route.ts` — Backend chat API using z-ai-web-dev-sdk
- `/src/components/public/chat-widget.tsx` — Floating AI chat widget component
- `/src/app/api/batches/route.ts` — Admin batch API (GET/POST)
- `/src/app/api/batches/[id]/route.ts` — Admin batch API (PUT/DELETE)
- `/src/app/api/public/batches/route.ts` — Public batch API (GET)
- `/src/components/batches/batch-view.tsx` — Admin batch management component

## Files Modified
- `/src/components/public/public-layout.tsx` — Added ChatWidget import and component
- `/prisma/schema.prisma` — Added Batch model
- `/src/store/app-store.ts` — Added 'batches' to ViewType
- `/src/app/admin/page.tsx` — Added Batches tab with CalendarDays icon
- `/src/components/public/upcoming-batches-section.tsx` — Changed from hardcoded to API-driven

## Database Changes
- Added `Batch` model with fields: id, courseName, department, startDate, duration, timing, seats, status, fee, description, sortOrder, active, createdAt, updatedAt
- Seeded 6 initial batches matching the previous hardcoded data

## Key Decisions
- Chat widget positioned at bottom-24 right-6 to avoid overlap with BackToTop (bottom-6 right-6)
- Used in-memory Map for conversation history (not persistent across server restarts)
- ZAI.create() called per request for simplicity
- Admin batches only accessible by admin role (adminOnly: true in nav items)
- Public batches API excludes closed batches (status !== 'closed')
