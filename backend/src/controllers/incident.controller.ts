import { Request, Response, NextFunction } from 'express';
import * as incidentService from '../services/incident.service.js';

export async function listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const incidents = await incidentService.listIncidents(req.user!.orgId, status);
    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
}

export async function getIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incident = await incidentService.getIncidentById(req.params.id as string, req.user!.orgId);
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incident = await incidentService.acknowledgeIncident(
      req.params.id as string,
      req.user!.userId,
      req.user!.orgId,
      req.ip
    );
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}
