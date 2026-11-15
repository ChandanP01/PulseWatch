import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from './audit.service.js';

export async function listTeamMembers(orgId: string) {
  return User.find({ orgId })
    .select('name email role avatarUrl createdAt')
    .sort({ createdAt: 1 });
}

export async function inviteTeamMember(
  orgId: string,
  inviterId: string,
  data: { email: string; name: string; role: UserRole },
  ipAddress?: string
) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new AppError('A user with this email already exists', 409);
  }

  // Generate temporary random password
  const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(tempPassword, salt);

  const user = await User.create({
    orgId,
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role || 'member',
    passwordHash,
  });

  await logAuditEvent({
    orgId,
    userId: inviterId,
    action: 'TEAM_MEMBER_INVITED',
    details: { invitedEmail: user.email, role: user.role },
    ipAddress,
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    temporaryPassword: tempPassword,
  };
}

export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  newRole: UserRole,
  requesterId: string,
  ipAddress?: string
) {
  const user = await User.findOne({ _id: targetUserId, orgId });
  if (!user) {
    throw new AppError('Team member not found', 404);
  }

  if (user.role === 'owner') {
    throw new AppError('Cannot modify the organization owner role', 400);
  }

  user.role = newRole;
  await user.save();

  await logAuditEvent({
    orgId,
    userId: requesterId,
    action: 'TEAM_MEMBER_ROLE_UPDATED',
    details: { targetUserId: user._id, newRole },
    ipAddress,
  });

  return user;
}

export async function removeTeamMember(
  orgId: string,
  targetUserId: string,
  requesterId: string,
  ipAddress?: string
) {
  const user = await User.findOne({ _id: targetUserId, orgId });
  if (!user) {
    throw new AppError('Team member not found', 404);
  }

  if (user.role === 'owner') {
    throw new AppError('Cannot remove organization owner', 400);
  }

  await User.deleteOne({ _id: targetUserId, orgId });

  await logAuditEvent({
    orgId,
    userId: requesterId,
    action: 'TEAM_MEMBER_REMOVED',
    details: { targetUserId, email: user.email },
    ipAddress,
  });

  return { success: true, message: 'Member removed from team.' };
}
