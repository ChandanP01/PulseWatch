import { Incident } from '../models/Incident.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from './audit.service.js';

export async function listIncidents(orgId: string, status?: string) {
  const filter: any = { orgId };
  if (status && ['OPEN', 'INVESTIGATING', 'RESOLVED'].includes(status)) {
    filter.status = status;
  }

  return Incident.find(filter)
    .populate('monitorId', 'name url currentStatus')
    .populate('acknowledgedBy', 'name email')
    .sort({ startedAt: -1 })
    .limit(100);
}

export async function getIncidentById(incidentId: string, orgId: string) {
  const incident = await Incident.findOne({ _id: incidentId, orgId })
    .populate('monitorId', 'name url currentStatus')
    .populate('acknowledgedBy', 'name email');

  if (!incident) {
    throw new AppError('Incident not found', 404);
  }

  return incident;
}

export async function acknowledgeIncident(incidentId: string, userId: string, orgId: string, ipAddress?: string) {
  const incident = await Incident.findOne({ _id: incidentId, orgId });
  if (!incident) {
    throw new AppError('Incident not found', 404);
  }

  if (incident.status === 'RESOLVED') {
    throw new AppError('Cannot acknowledge an already resolved incident', 400);
  }

  incident.status = 'INVESTIGATING';
  incident.acknowledgedBy = userId as any;
  incident.acknowledgedAt = new Date();
  await incident.save();

  await logAuditEvent({
    orgId,
    userId,
    action: 'INCIDENT_ACKNOWLEDGED',
    details: { incidentId: incident._id },
    ipAddress,
  });

  return incident;
}
