import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-options"

export async function requireStudent() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'student') {
    redirect("/login")
  }

  const userId = (session.user as any).id;

  const student = await db.student.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        where: { status: "active" },
        include: { course: true }
      },
      bookings: {
        where: { status: "active" },
        include: { cabin: true }
      },
      payments: {
        include: { booking: { include: { cabin: true } } }
      },
      enrollmentPayments: {
        include: { enrollment: { include: { course: true } } }
      }
    }
  })

  if (!student) {
    redirect("/login")
  }

  return { userId, student }
}
