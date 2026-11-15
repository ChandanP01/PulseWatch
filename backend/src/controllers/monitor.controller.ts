import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as monitorService from '../services/monitor.service.js';
import { scheduler } from '../engine/scheduler.js';
import { AppError } from '../middleware/errorHandler.js';

export const createMonitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      'URL must start with http:// or https://'
    ),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'DELETE']).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  intervalSeconds: z.number().min(30).max(86400).optional(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  expectedStatusCode: z.number().min(100).max(599).optional(),
  keyword: z.string().optional(),
  sslCheckEnabled: z.boolean().optional(),
});

export const updateMonitorSchema = createMonitorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export async function listMonitors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitors = await monitorService.listMonitors(req.user!.orgId);
    res.json({ success: true, data: monitors });
  } catch (error) {
    next(error);
  }
}

export async function getMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitor = await monitorService.getMonitorById(req.params.id as string, req.user!.orgId);
    res.json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
}

export async function createMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitor = await monitorService.createMonitor(
      req.body,
      req.user!.userId,
      req.user!.orgId,
      req.ip
    );
    res.status(201).json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
}

export async function updateMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitor = await monitorService.updateMonitor(
      req.params.id as string,
      req.body,
      req.user!.userId,
      req.user!.orgId,
      req.ip
    );
    res.json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
}

export async function deleteMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await monitorService.deleteMonitor(
      req.params.id as string,
      req.user!.userId,
      req.user!.orgId,
      req.ip
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function toggleMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitor = await monitorService.toggleMonitorStatus(
      req.params.id as string,
      req.user!.userId,
      req.user!.orgId
    );
    res.json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
}

export async function checkNow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const monitor = await monitorService.getMonitorById(req.params.id as string, req.user!.orgId);
    const probeResult = await scheduler.executeCheck(monitor);
    res.json({ success: true, data: { probeResult, monitor } });
  } catch (error) {
    next(error);
  }
}

export async function getHeartbeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 60;
    const heartbeats = await monitorService.getMonitorHeartbeats(
      req.params.id as string,
      req.user!.orgId,
      limit
    );
    res.json({ success: true, data: heartbeats });
  } catch (error) {
    next(error);
  }
}
