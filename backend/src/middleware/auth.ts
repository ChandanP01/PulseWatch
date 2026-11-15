import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface AuthUserPayload {
  userId: string;
  orgId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. Missing Bearer token.' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUserPayload;

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired authentication token.' },
    });
  }
}
