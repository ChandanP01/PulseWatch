import mongoose, { Schema, Document } from 'mongoose';

export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE';

export interface IMonitor extends Document {
  orgId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
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
  lastCheckAt?: Date;
  lastStatusCode?: number;
  lastResponseTimeMs?: number;
  lastErrorMessage?: string;
  certExpiryDays?: number;
  consecutiveFails: number;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgResponseTime24h: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorSchema = new Schema<IMonitor>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'DELETE'],
      default: 'GET',
    },
    headers: { type: Map, of: String, default: {} },
    body: { type: String, default: '' },
    intervalSeconds: { type: Number, default: 60, min: 30 },
    timeoutMs: { type: Number, default: 10000, min: 1000, max: 60000 },
    expectedStatusCode: { type: Number, default: 200 },
    keyword: { type: String, default: '' },
    sslCheckEnabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    currentStatus: {
      type: String,
      enum: ['UP', 'DOWN', 'DEGRADED', 'PAUSED'],
      default: 'PAUSED',
      index: true,
    },
    lastCheckAt: { type: Date },
    lastStatusCode: { type: Number },
    lastResponseTimeMs: { type: Number },
    lastErrorMessage: { type: String },
    certExpiryDays: { type: Number },
    consecutiveFails: { type: Number, default: 0 },
    uptime24h: { type: Number, default: 100 },
    uptime7d: { type: Number, default: 100 },
    uptime30d: { type: Number, default: 100 },
    avgResponseTime24h: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MonitorSchema.index({ orgId: 1, isActive: 1 });

export const Monitor = mongoose.model<IMonitor>('Monitor', MonitorSchema);
