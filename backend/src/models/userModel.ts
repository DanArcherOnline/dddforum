import { randomBytes } from 'crypto';
import { prisma } from '../database/prismaClient';
import type { User } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';

export type CreateUserInput = Pick<User, 'email' | 'username' | 'firstName' | 'lastName'>;

export async function createUser(input: CreateUserInput): Promise<User> {
  const password = randomBytes(32).toString('hex');
  return prisma.user.create({
    data: {
      ...input,
      password,
    },
  });
}

export type UpdateUserInput = Partial<Pick<User, 'email' | 'username' | 'firstName' | 'lastName'>>;

export async function updateUser(userId: number, data: UpdateUserInput): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { username } });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
