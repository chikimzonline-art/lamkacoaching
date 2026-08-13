"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { XCircle, Loader2 } from "lucide-react"
import { cancelCabinBooking } from "@/app/(student)/dashboard/cabins/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CancelBookingButtonProps {
  bookingId: string
  className?: string
}

export function CancelBookingButton({ bookingId, className }: CancelBookingButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this pending booking? The cabin will be released immediately.")) return

    startTransition(async () => {
      try {
        await cancelCabinBooking(bookingId)
        toast.success("Booking cancelled successfully")
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to cancel booking")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleCancel}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      Cancel Booking
    </Button>
  )
}
