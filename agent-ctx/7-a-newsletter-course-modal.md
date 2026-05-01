# Task 7-a: Newsletter Backend & Course Detail Modal

## Summary
Added newsletter subscription backend, updated contact form to persist to DB, and added course detail modal to courses page.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)
- Added `NewsletterSubscriber` model (id, email [unique], active, timestamps)
- Added `ContactSubmission` model (id, name, phone, email?, subject?, message, status, timestamps)
- Ran `bun run db:push` successfully

### 2. Newsletter API (`src/app/api/newsletter/route.ts`)
- POST handler accepting `{ email: string }`
- Validates email format (regex check)
- Returns 400 for invalid/missing email
- Returns 409 for duplicate active subscription
- Reactivates inactive subscribers on re-subscribe
- Saves new subscribers to NewsletterSubscriber model
- Returns 200 with success message

### 3. Footer Newsletter Integration (`src/components/public/public-footer.tsx`)
- Added state: `email`, `subscribed`, `loading`
- Added `handleNewsletterSubmit` async function
- POSTs to `/api/newsletter` with email
- Shows success state (CheckCircle2 icon + "Thank you for subscribing!")
- Shows error toast on 409 (duplicate) or other failures via `toast` from sonner
- Loading state with Loader2 spinner on Subscribe button
- Form resets after success (email cleared, subscribed=true)
- Imported `Loader2`, `CheckCircle2` from lucide-react and `toast` from sonner

### 4. Contact API Update (`src/app/api/contact/route.ts`)
- Added `import { db } from '@/lib/db'`
- Replaced `console.log` with `db.contactSubmission.create()`
- Persists name, phone, email, subject, message to ContactSubmission model
- Maintains existing validation and response format
- Added error logging for catch block

### 5. Course Detail Modal (`src/app/courses/page.tsx`)
- Added `selectedCourse` state (null when closed, object with course+department data when open)
- Made course cards clickable (`cursor-pointer` class, `onClick` handler)
- Course Detail Dialog shows:
  - Course name (large title, pr-8 for close button space)
  - Department badge with Building2 icon
  - Duration with Clock icon
  - Fee formatted with ₹ using existing `formatCurrency`
  - Full description (or "No description available" fallback)
  - "Enroll Now" button linking to /register?courseId=X with ArrowRight icon
  - "Close" button to dismiss dialog
- Style: rounded-2xl, bg-white dark:bg-gray-900, proper padding, dark mode support
- Dialog uses existing Dialog/DialogContent/DialogHeader/DialogTitle imports

## Verification
- `bun run db:push` completed successfully
- Dev server compiles without errors
- No new lint errors (42 pre-existing errors in studyspace examples only)
- All existing functionality preserved (comparison dialog, fee calculator, search, filters)
