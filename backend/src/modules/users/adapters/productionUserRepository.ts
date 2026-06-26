import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { User } from "../../../generated/prisma/client";
import type { ValidatedUser } from "@dddforum/shared/src/api/users";
import type { UsersRepository } from "../ports/usersRepository";

export class ProductionUserRepository implements UsersRepository {
  constructor(private prisma: PrismaClient) {}

  async save(userData: ValidatedUser): Promise<User> {
    const { email, firstName, lastName, username, password } = userData;
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

  async findById(id: number): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({ where: { id } });
    } catch {
      throw new Error("Database exception");
    }
  }

  async delete(email: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { email } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return;
      }
      throw err;
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({ where: { username } });
    } catch {
      throw new Error("Database exception");
    }
  }

  async update(id: number, props: Partial<ValidatedUser>): Promise<User | null> {
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
