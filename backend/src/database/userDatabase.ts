import { randomBytes } from "crypto";
import { Prisma } from "../generated/prisma/client";
import type { User } from "../generated/prisma/client";
import { prisma } from "./prismaClient";
import type { CreateUserInput, UpdateUserInput } from "@dddforum/shared/src/api/users";

export class UserDatabase {
  async createUser(input: CreateUserInput): Promise<User> {
    const password = randomBytes(32).toString("hex");
    return prisma.user.create({ data: { ...input, password } });
  }

  async updateUser(userId: number, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { username } });
  }

  isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
    );
  }
}
