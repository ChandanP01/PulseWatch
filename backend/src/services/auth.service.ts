import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from './audit.service.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(user: IUser): TokenPair {
  const payload = {
    userId: user._id.toString(),
    orgId: user.orgId.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });

  return { accessToken, refreshToken };
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  orgName?: string;
  ipAddress?: string;
}) {
  const existingUser = await User.findOne({ email: params.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // 1. Create Organization
  const orgSlug = (params.orgName || `${params.name}'s Org`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

  const organization = await Organization.create({
    name: params.orgName || `${params.name}'s Team`,
    slug: orgSlug,
    plan: 'free',
  });

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(params.password, salt);

  // 3. Create User with 'owner' role
  const user = await User.create({
    orgId: organization._id,
    email: params.email.toLowerCase(),
    passwordHash,
    name: params.name,
    role: 'owner',
  });

  const tokens = generateTokens(user);

  // Store hashed refresh token
  const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
  user.refreshTokenHash = refreshHash;
  await user.save();

  await logAuditEvent({
    orgId: organization._id,
    userId: user._id,
    action: 'USER_REGISTERED',
    details: { email: user.email, orgName: organization.name },
    ipAddress: params.ipAddress,
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    organization: {
      id: organization._id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
    },
    ...tokens,
  };
}

export async function loginUser(params: {
  email: string;
  password: string;
  ipAddress?: string;
}) {
  const user = await User.findOne({ email: params.email.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(params.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const organization = await Organization.findById(user.orgId);
  const tokens = generateTokens(user);

  const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
  user.refreshTokenHash = refreshHash;
  await user.save();

  await logAuditEvent({
    orgId: user.orgId,
    userId: user._id,
    action: 'USER_LOGIN',
    details: { email: user.email },
    ipAddress: params.ipAddress,
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    organization: organization
      ? {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
        }
      : null,
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokenHash) {
      throw new AppError('Invalid session. Please login again.', 401);
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new AppError('Refresh token revoked or invalidated.', 401);
    }

    const tokens = generateTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    return tokens;
  } catch (err: any) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
