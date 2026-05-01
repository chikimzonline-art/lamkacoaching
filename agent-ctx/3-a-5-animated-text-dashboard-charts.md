# Task 3-a and 5: Animated Gradient Text & Dashboard Charts

## Task
Add animated gradient text effect to hero title and enhance admin dashboard with Recharts charts.

## Work Summary

### Part 1: Animated Gradient Text
- Added CSS keyframes `gradient-shift` and `.animate-gradient-text` class to `globals.css`
- Applied to hero title word "Future" — `bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 bg-clip-text text-transparent animate-gradient-text`
- Applied to CTA section highlight "Starts Here" — same gradient + animation
- Animation: 4s ease infinite, 200% background-size, subtle shifting effect
- Section spacing verified as consistent (py-20 sm:py-28 standard)

### Part 2: Admin Dashboard Charts
- Added 3 Recharts charts to `dashboard-view.tsx`:
  1. **Monthly Enrollments Bar Chart** — 6 months of mock data, cyan bars (#06b6d4)
  2. **Students by Department Pie Chart** — donut chart with 4 departments, cyan/sky/teal palette
  3. **Revenue Trend Line Chart** — 6 months, smooth monotone line, ₹ formatted Y-axis
- Charts in 3-column grid between stat cards and booking/payment sections
- All charts: h-[220px], ResponsiveContainer, proper tooltips, dark mode support
- Mock data: monthlyEnrollmentsData, departmentData, revenueTrendData

## Files Modified
- `/src/app/globals.css` — Added gradient-shift keyframes and .animate-gradient-text class
- `/src/app/page.tsx` — Applied animated gradient to hero "Future" and CTA "Starts Here"
- `/src/components/dashboard/dashboard-view.tsx` — Added 3 Recharts charts with mock data

## Verification
- No new lint errors
- Dev server compiles successfully
