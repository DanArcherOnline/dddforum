import { randomBytes } from "crypto";
import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { User } from "../../../generated/prisma/client";
import type { CreateUserParams, UpdateUserInput } from "@dddforum/shared/src/api/users";
import type { UsersRepository } from "../ports/usersRepository";

export class ProductionUserRepository implements UsersRepository {
  constructor(private prisma: PrismaClient) {}

  async save(userData: CreateUserParams): Promise<User> {
    const password = randomBytes(32).toString("hex");
    const { email, firstName, lastName, username } = userData;
    return await this.prisma.$transaction(async () => {
      const user = await this.prisma.user.create({
        data: { email, username, firstName, lastName, password },
      });
      await this.prisma.member.create({ data: { userId: user.id } });
      return user;
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch {
      throw new Error("Database exception");
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({ where: { username } });
    } catch {
      throw new Error("Database exception");
    }
  }

  async update(id: number, props: UpdateUserInput): Promise<User | null> {
    try {
      return await this.prisma.user.update({ where: { id }, data: props });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return null;
      }
      throw err;
    }
  }
}
