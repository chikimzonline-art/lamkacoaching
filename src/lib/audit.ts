import { db } from '@/lib/db';
import { AuthUser } from '@/lib/auth';

export type AuditAction =
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_DELETED'
  | 'STUDENT_CREATED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_DELETED'
  | 'BATCH_CREATED'
  | 'BATCH_UPDATED'
  | 'BATCH_DELETED'
  | 'COURSE_CREATED'
  | 'COURSE_UPDATED'
  | 'COURSE_DELETED'
  | 'DEPARTMENT_CREATED'
  | 'DEPARTMENT_UPDATED'
  | 'DEPARTMENT_DELETED'
  | 'ENROLLMENT_CREATED'
  | 'ENROLLMENT_UPDATED'
  | 'ENROLLMENT_DELETED'
  | 'BOOKING_CREATED'
  | 'BOOKING_UPDATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'ATTENDANCE_CHECKIN'
  | 'ATTENDANCE_CHECKOUT'
  | 'NOTICE_CREATED'
  | 'NOTICE_UPDATED'
  | 'NOTICE_DELETED'
  | 'SUPPORT_TICKET_REPLIED'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'SUPPORT_TICKET_DELETED'
  | 'SETTINGS_UPDATED'
  | 'ASSET_UPLOADED'
  | 'ASSET_DELETED';

export type AuditEntityType =
  | 'Payment'
  | 'Student'
  | 'Batch'
  | 'Course'
  | 'Department'
  | 'Enrollment'
  | 'Booking'
  | 'Attendance'
  | 'Notice'
  | 'SupportTicket'
  | 'Setting'
  | 'Asset';

export interface LogAuditParams {
  user?: AuthUser | null;
  userName?: string;
  userRole?: string;
  userId?: string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId?: string | null;
  description: string;
  details?: Record<string, unknown> | string | null;
  req?: Request | null;
}

export async function logAudit({
  user,
  userName,
  userRole,
  userId,
  action,
  entityType,
  entityId,
  description,
  details,
  req,
}: LogAuditParams) {
  try {
    const resolvedName = user?.name || user?.username || userName || 'System';
    const resolvedRole = user?.role || userRole || 'system';
    const resolvedUserId = user?.id || userId || null;

    let ipAddress: string | null = null;
    if (req) {
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const cfIp = req.headers.get('cf-connecting-ip');
      ipAddress = forwarded ? forwarded.split(',')[0].trim() : (realIp || cfIp || null);
    }

    let serializedDetails: string | null = null;
    if (details) {
      if (typeof details === 'string') {
        serializedDetails = details;
      } else {
        try {
          serializedDetails = JSON.stringify(details);
        } catch {
          serializedDetails = String(details);
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: resolvedUserId,
        userName: resolvedName,
        userRole: resolvedRole,
        action,
        entityType,
        entityId: entityId || null,
        description,
        details: serializedDetails,
        ipAddress,
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure core operational mutations never fail if logging hits an issue
    console.error('[AuditLog] Failed to record audit log:', error);
  }
}
