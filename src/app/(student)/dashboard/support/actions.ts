'use server'

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function submitSupportTicket(formData: FormData) {
  const { student } = await requireStudent()
  
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  if (!subject || !message) {
    return { error: "Subject and message are required" }
  }

  try {
    await db.supportTicket.create({
      data: {
        studentId: student.id,
        subject,
        message,
        status: 'open'
      }
    })
    
    revalidatePath("/dashboard/support")
    return { success: true }
  } catch (error) {
    console.error("Failed to create support ticket:", error)
    return { error: "Failed to submit your request. Please try again later." }
  }
}
