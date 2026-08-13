import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import ManageBookingClient from "./client"

export default async function ManageBookingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { student } = await requireStudent();

  const booking = await db.booking.findUnique({
    where: { 
      id: params.id,
      studentId: student.id
    },
    include: {
      cabin: true,
      payments: {
        orderBy: { receivedAt: 'desc' }
      }
    }
  })

  if (!booking) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <ManageBookingClient booking={booking as any} student={student} />
    </div>
  )
}
