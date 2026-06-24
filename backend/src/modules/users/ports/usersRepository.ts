import type { User } from "../../../generated/prisma/client";
import type { CreateUserParams, UpdateUserInput } from "@dddforum/shared/src/api/users";

export interface UsersRepository {
  save(user: CreateUserParams): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  update(id: number, props: UpdateUserInput): Promise<User | null>;
}
