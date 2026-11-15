import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';

export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await AuditLog.find({ orgId: req.user!.orgId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}
