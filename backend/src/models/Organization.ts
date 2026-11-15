import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxMonitors: number;
  checkIntervalLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    maxMonitors: { type: Number, default: 10 },
    checkIntervalLimit: { type: Number, default: 60 }, // Minimum seconds allowed
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
