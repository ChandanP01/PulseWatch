import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface IUser extends Document {
  orgId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  refreshTokenHash?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    refreshTokenHash: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
