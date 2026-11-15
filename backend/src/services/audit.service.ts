import { AuditLog } from '../models/AuditLog.js';

export async function logAuditEvent(params: {
  orgId: any;
  userId?: any;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      orgId: params.orgId,
      userId: params.userId,
      action: params.action,
      details: params.details || {},
      ipAddress: params.ipAddress,
      createdAt: new Date(),
    });
  } catch (err: any) {
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
}
