import mongoose, { Schema, Document } from 'mongoose';

export type HeartbeatStatus = 'UP' | 'DOWN' | 'DEGRADED';

export interface IHeartbeat extends Document {
  monitorId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  status: HeartbeatStatus;
  statusCode: number;
  responseTimeMs: number;
  dnsLookupMs?: number;
  tlsHandshakeMs?: number;
  certExpiryDays?: number;
  errorMessage?: string;
  checkedAt: Date;
}

const HeartbeatSchema = new Schema<IHeartbeat>(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    status: { type: String, enum: ['UP', 'DOWN', 'DEGRADED'], required: true },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    dnsLookupMs: { type: Number },
    tlsHandshakeMs: { type: Number },
    certExpiryDays: { type: Number },
    errorMessage: { type: String },
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Fast time-range querying per monitor
HeartbeatSchema.index({ monitorId: 1, checkedAt: -1 });

// TTL Index: Automatically expire heartbeats older than 30 days
HeartbeatSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Heartbeat = mongoose.model<IHeartbeat>('Heartbeat', HeartbeatSchema);
