import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  orgId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ orgId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
