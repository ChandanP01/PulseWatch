import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service.js';

export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const overview = await analyticsService.getDashboardOverview(req.user!.orgId);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}
