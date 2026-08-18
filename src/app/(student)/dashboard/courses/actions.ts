"use server"

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

import { z } from "zod"

const EnrollSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  batchId: z.string().min(1, "Batch ID is required")
})

const WaitlistSchema = z.object({
  courseId: z.string().min(1, "Course ID is required")
})

export async function enrollInCourse(rawCourseId: string, rawBatchId: string) {
  try {
    const { courseId, batchId } = EnrollSchema.parse({ courseId: rawCourseId, batchId: rawBatchId })
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
      return { success: false, error: "Already enrolled in this course." }
    }

    const course = await db.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return { success: false, error: "Course not found." }
    }

    if (!batchId) {
      return { success: false, error: "Please select a batch to enroll in." }
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
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Enrollment Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during enrollment." }
  }
}

export async function joinWaitlist(rawCourseId: string) {
  try {
    const { courseId } = WaitlistSchema.parse({ courseId: rawCourseId })
    const { student } = await requireStudent()

    const existing = await db.courseWaitlist.findFirst({
      where: { studentId: student.id, courseId }
    })

    if (existing) {
      return { success: false, error: "You are already on the waitlist for this course." }
    }

    await db.courseWaitlist.create({
      data: {
        studentId: student.id,
        courseId
      }
    })

    revalidatePath("/dashboard/courses")
    return { success: true }
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Waitlist Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred joining the waitlist." }
  }
}
