export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Monitor {
  _id: string;
  orgId: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
  keyword?: string;
  sslCheckEnabled: boolean;
  isActive: boolean;
  currentStatus: MonitorStatus;
  lastCheckAt?: string;
  lastStatusCode?: number;
  lastResponseTimeMs?: number;
  lastErrorMessage?: string;
  certExpiryDays?: number;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgResponseTime24h: number;
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  _id: string;
  monitorId: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  statusCode: number;
  responseTimeMs: number;
  certExpiryDays?: number;
  errorMessage?: string;
  checkedAt: string;
}

export interface Incident {
  _id: string;
  monitorId: {
    _id: string;
    name: string;
    url: string;
    currentStatus?: MonitorStatus;
  } | string;
  status: IncidentStatus;
  cause: string;
  rootCauseSummary: string;
  startedAt: string;
  resolvedAt?: string;
  durationSeconds?: number;
  acknowledgedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  acknowledgedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface DashboardOverview {
  totalMonitors: number;
  activeMonitorsCount: number;
  upCount: number;
  downCount: number;
  pausedCount: number;
  overallUptime24h: number;
  avgResponseTimeMs: number;
  activeIncidentsCount: number;
  activeIncidents: Incident[];
}
