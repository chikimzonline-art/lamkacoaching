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
        where: { status: { in: ["active", "pending_payment"] } },
        include: {
          course: {
            include: { department: true }
          },
          batch: true
        }
      },
      bookings: {
        where: { status: { in: ["active", "pending_payment"] } },
        include: { cabin: true }
      },
      payments: {
        orderBy: { receivedAt: 'desc' },
        include: { booking: { include: { cabin: true } } }
      },
      enrollmentPayments: {
        orderBy: { receivedAt: 'desc' },
        include: {
          enrollment: {
            include: {
              course: {
                include: { department: true }
              },
              batch: true
            }
          }
        }
      }
    }
  })

  if (!student) {
    redirect("/login")
  }

  return { userId, student }
}
