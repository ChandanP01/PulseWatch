import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

// Hierarchy order
const roleLevels: Record<UserRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function authorize(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. Please sign in.' },
      });
      return;
    }

    const userLevel = roleLevels[req.user.role] || 0;
    const requiredLevel = roleLevels[minRole] || 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Requires at least '${minRole}' role, but your role is '${req.user.role}'.`,
        },
      });
      return;
    }

    next();
  };
}
