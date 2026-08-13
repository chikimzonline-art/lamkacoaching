"use server"

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function enrollInCourse(courseId: string, batchId: string) {
  const { student } = await requireStudent()

  // Ensure they aren't already enrolled in this course
  const existing = await db.enrollment.findFirst({
    where: {
      studentId: student.id,
      courseId: courseId,
      status: "active"
    }
  })

  if (existing) {
    throw new Error("Already enrolled in this course.")
  }

  const course = await db.course.findUnique({
    where: { id: courseId }
  })

  if (!course) {
    throw new Error("Course not found.")
  }

  if (!batchId) {
    throw new Error("Please select a batch to enroll in.")
  }

  const newEnrollment = await db.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      batchId: batchId,
      startDate: new Date(),
      totalFee: course.totalFee,
      paidAmount: 0,
      status: "pending_payment", // Defer payment
      notes: "Registered via Student Dashboard"
    }
  })

  revalidatePath("/dashboard/courses")
  return { success: true, enrollmentId: newEnrollment.id }
}

export async function joinWaitlist(courseId: string) {
  const { student } = await requireStudent()

  const existing = await db.courseWaitlist.findFirst({
    where: { studentId: student.id, courseId }
  })

  if (existing) {
    throw new Error("You are already on the waitlist for this course.")
  }

  await db.courseWaitlist.create({
    data: {
      studentId: student.id,
      courseId
    }
  })

  revalidatePath("/dashboard/courses")
}
