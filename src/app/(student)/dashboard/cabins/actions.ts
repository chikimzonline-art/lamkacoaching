"use server"

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function bookCabin(cabinId: string, durationMonths: number) {
  const { student } = await requireStudent()

  // Find the cabin
  const cabin = await db.cabin.findUnique({
    where: { id: cabinId }
  })

  if (!cabin) {
    throw new Error("Cabin not found.")
  }

  // Ensure they don't already have an active booking for this cabin
  const existing = await db.booking.findFirst({
    where: {
      studentId: student.id,
      cabinId: cabin.id,
      status: "active"
    }
  })

  if (existing) {
    throw new Error("Already booked this cabin.")
  }

  // Calculate dates and amounts
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + durationMonths)

  // Monthly cabin fee (assuming flat rate 1000/month for now if not specified in schema, 
  // wait, the schema doesn't have a fee in Cabin. We will use a mock 500/month for the wireframe)
  const feePerMonth = 500
  const totalAmount = feePerMonth * durationMonths

  await db.booking.create({
    data: {
      studentId: student.id,
      cabinId: cabin.id,
      type: "monthly",
      startDate,
      endDate,
      totalAmount,
      paidAmount: 0,
      status: "pending_payment", // Defer payment
      notes: `Booked for ${durationMonths} months via Student Dashboard`
    }
  })

  revalidatePath("/dashboard/cabins")
  redirect("/dashboard/cabins")
}
