// lib/audit/logger.ts – comprehensive audit logging for security events

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export type AuditAction =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT'
  | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE' | 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_DELETED'
  | 'TWO_FACTOR_ENABLED' | 'TWO_FACTOR_DISABLED'
  | 'SUBSCRIPTION_UPGRADED' | 'SUBSCRIPTION_CANCELED' | 'SUBSCRIPTION_RENEWED'
  | 'FILE_UPLOADED' | 'FILE_DELETED' | 'GRADING_STARTED' | 'GRADING_COMPLETED'
  | 'ADMIN_ACTION' | 'API_KEY_GENERATED' | 'DATA_EXPORT_REQUESTED' | 'DATA_DELETED'
  | 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'COUPON_APPLIED'

export interface AuditEntry {
  userId?: string
  action: AuditAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  severity: 'info' | 'warn' | 'critical'
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: entry.severity === 'critical' ? 'error' : entry.severity,
        message: `AUDIT: ${entry.action}`,
        userId: entry.userId,
        context: {
          action: entry.action,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent?.slice(0, 200),
          ...entry.metadata,
        },
      },
    })
  } catch (err) {
    // Never let audit logging crash the main flow
    logger.error('Audit log write failed', { err, action: entry.action })
  }
}

// Security event helpers
export const audit = {
  loginSuccess: (userId: string, ip: string, ua: string) =>
    auditLog({ userId, action: 'LOGIN_SUCCESS', ipAddress: ip, userAgent: ua, severity: 'info' }),

  loginFailed: (email: string, ip: string, reason: string) =>
    auditLog({ action: 'LOGIN_FAILED', ipAddress: ip, metadata: { email, reason }, severity: 'warn' }),

  passwordChange: (userId: string, ip: string) =>
    auditLog({ userId, action: 'PASSWORD_CHANGE', ipAddress: ip, severity: 'warn' }),

  subscriptionUpgraded: (userId: string, oldPlan: string, newPlan: string) =>
    auditLog({ userId, action: 'SUBSCRIPTION_UPGRADED', metadata: { oldPlan, newPlan }, severity: 'info' }),

  paymentSucceeded: (userId: string, amount: number, currency: string) =>
    auditLog({ userId, action: 'PAYMENT_SUCCEEDED', metadata: { amount, currency }, severity: 'info' }),

  paymentFailed: (userId: string, amount: number) =>
    auditLog({ userId, action: 'PAYMENT_FAILED', metadata: { amount }, severity: 'warn' }),

  adminAction: (adminId: string, action: string, targetUserId?: string) =>
    auditLog({
      userId: adminId,
      action: 'ADMIN_ACTION',
      metadata: { action, targetUserId },
      severity: 'warn',
    }),

  dataExport: (userId: string, ip: string) =>
    auditLog({ userId, action: 'DATA_EXPORT_REQUESTED', ipAddress: ip, severity: 'info' }),

  dataDeleted: (userId: string, ip: string) =>
    auditLog({ userId, action: 'DATA_DELETED', ipAddress: ip, severity: 'critical' }),
}
