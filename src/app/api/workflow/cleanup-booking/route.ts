import { serve } from "@upstash/workflow/nextjs"
import { db } from "@/lib/db"

export const { POST } = serve(async (context) => {
  const payload = context.requestPayload as { bookingId: string }
  const bookingId = payload.bookingId

  if (!bookingId) {
    console.error("No bookingId provided to workflow")
    return
  }

  // 1. Wait for 10 minutes
  await context.sleep("wait-for-payment", "10m")

  // 2. Check the database and clean up if still pending
  await context.run("cleanup-booking", async () => {
    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    })

    if (booking && booking.status === "pending_payment") {
      console.log(`Cleaning up abandoned booking: ${bookingId}`)
      await db.booking.delete({
        where: { id: bookingId }
      })
    } else {
      console.log(`Booking ${bookingId} is not pending (status: ${booking?.status}). Skipping cleanup.`)
    }
  })
})
