"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { XCircle, Loader2 } from "lucide-react"
import { cancelCourseEnrollment } from "@/app/(student)/dashboard/courses/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CancelEnrollmentButtonProps {
  enrollmentId: string
  className?: string
  variant?: "outline" | "ghost" | "secondary" | "destructive" | "default"
  buttonText?: string
}

export function CancelEnrollmentButton({
  enrollmentId,
  className,
  variant = "outline",
  buttonText = "Cancel Registration",
}: CancelEnrollmentButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this course registration? The course will be removed from your pending list.")) return

    startTransition(async () => {
      try {
        const res = await cancelCourseEnrollment(enrollmentId)
        if (res && !res.success) {
          toast.error(res.error || "Failed to cancel registration")
          return
        }
        toast.success("Course registration cancelled successfully")
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to cancel registration")
      }
    })
  }

  return (
    <Button
      variant={variant}
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
      {buttonText}
    </Button>
  )
}
