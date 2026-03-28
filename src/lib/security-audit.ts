import { prisma } from "./prisma";

export type AuditAction =
  | "SUPERADMIN_LOGIN"
  | "ADMIN_INVITE"
  | "ROLE_CHANGE"
  | "ADMIN_REMOVAL"
  | "STORE_ACCESS"
  | "INVENTORY_MODIFICATION"
  | "ORDER_MODIFICATION"
  | "SECURITY_SETTINGS_CHANGE";

export interface AuditLogEntry {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resourceId?: string;
  resourceType?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log security-relevant actions for audit trail
 */
export async function logSecurityAudit(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.userId,
        subjectId: entry.resourceId,
        details: JSON.stringify({
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          resourceType: entry.resourceType,
          ipAddress: entry.ipAddress || "unknown",
          userAgent: entry.userAgent || "unknown",
          ...entry.details,
        }),
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("Failed to log security audit:", error);
  }
}

/**
 * Check if user has MFA enabled (for super admin enforcement)
 */
export async function requireMFAForSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, role: true }
  });

  if (!user) return false;
  
  // Super admins must have MFA enabled
  if (user.role === "SUPERADMIN" && !user.mfaEnabled) {
    throw new Error("MFA required for super admin access");
  }

  return true;
}

/**
 * Get recent audit logs for a user or all logs for super admin
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  const { userId, action, limit = 50, offset = 0 } = options;

  const where: any = {};
  if (userId) where.actorId = userId;
  if (action) where.action = action;

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}