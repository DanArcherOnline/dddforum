import { PrismaClient } from "../generated/prisma/client";

export class Database {
  constructor(private prisma: PrismaClient) {}

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}
