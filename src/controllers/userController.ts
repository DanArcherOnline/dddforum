import type { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import * as userModel from '../models/userModel';
import { toPublicUser } from '../views/userView';

function parseUserId(param: string | string[] | undefined): number | null {
  const raw = Array.isArray(param) ? param[0] : param;
  if (raw === undefined) {
    return null;
  }
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function createNew(req: Request, res: Response): Promise<void> {
  const { email, username, firstName, lastName } = req.body as Record<string, unknown>;
  if (
    typeof email !== 'string' ||
    typeof username !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string'
  ) {
    res.status(400).json({ error: 'email, username, firstName, and lastName are required strings' });
    return;
  }

  try {
    const user = await userModel.createUser({ email, username, firstName, lastName });
    res.status(201).json(toPublicUser(user));
  } catch (error) {
    if (userModel.isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'email or username already exists' });
      return;
    }
    throw error;
  }
}

export async function editUser(req: Request, res: Response): Promise<void> {
  const userId = parseUserId(req.params.userId);
  if (userId === null) {
    res.status(400).json({ error: 'invalid user id' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const data: userModel.UpdateUserInput = {};
  if (typeof body.email === 'string') {
    data.email = body.email;
  }
  if (typeof body.username === 'string') {
    data.username = body.username;
  }
  if (typeof body.firstName === 'string') {
    data.firstName = body.firstName;
  }
  if (typeof body.lastName === 'string') {
    data.lastName = body.lastName;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'no updatable fields provided' });
    return;
  }

  try {
    const user = await userModel.updateUser(userId, data);
    res.status(200).json(toPublicUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    if (userModel.isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'email or username already exists' });
      return;
    }
    throw error;
  }
}

export async function getByEmail(req: Request, res: Response): Promise<void> {
  const raw = req.query.email;
  const email = Array.isArray(raw) ? raw[0] : raw;
  if (typeof email !== 'string' || email.length === 0) {
    res.status(400).json({ error: 'query parameter email is required' });
    return;
  }

  const user = await userModel.findUserByEmail(email);
  if (user === null) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  res.status(200).json(toPublicUser(user));
}
