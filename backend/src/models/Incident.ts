import mongoose, { Schema, Document } from 'mongoose';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export interface IIncident extends Document {
  monitorId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  status: IncidentStatus;
  cause: string;
  rootCauseSummary: string;
  startedAt: Date;
  resolvedAt?: Date;
  durationSeconds?: number;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    cause: { type: String, required: true },
    rootCauseSummary: { type: String, required: true },
    startedAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
  },
  { timestamps: true }
);

IncidentSchema.index({ orgId: 1, status: 1 });
IncidentSchema.index({ monitorId: 1, status: 1 });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
