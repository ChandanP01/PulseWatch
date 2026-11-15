import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as teamService from '../services/team.service.js';

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await teamService.listTeamMembers(req.user!.orgId);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await teamService.inviteTeamMember(
      req.user!.orgId,
      req.user!.userId,
      req.body,
      req.ip
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await teamService.updateMemberRole(
      req.user!.orgId,
      req.params.id as string,
      req.body.role,
      req.user!.userId,
      req.ip
    );
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await teamService.removeTeamMember(
      req.user!.orgId,
      req.params.id as string,
      req.user!.userId,
      req.ip
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
