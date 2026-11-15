import mongoose, { Schema, Document } from 'mongoose';

export type AlertChannelType = 'EMAIL' | 'WEBHOOK';
export type AlertEventType = 'DOWN' | 'UP' | 'SSL_EXPIRING';

export interface IAlertChannel extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  type: AlertChannelType;
  target: string; // Email address or Webhook URL
  events: AlertEventType[];
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertChannelSchema = new Schema<IAlertChannel>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['EMAIL', 'WEBHOOK'], default: 'EMAIL' },
    target: { type: String, required: true, trim: true },
    events: {
      type: [String],
      enum: ['DOWN', 'UP', 'SSL_EXPIRING'],
      default: ['DOWN', 'UP'],
    },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AlertChannel = mongoose.model<IAlertChannel>('AlertChannel', AlertChannelSchema);
