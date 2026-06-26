import type { User } from "../../../generated/prisma/client";
import type { ValidatedUser } from "@dddforum/shared/src/api/users";

export interface UsersRepository {
  save(user: ValidatedUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  delete(email: string): Promise<void>;
  findUserByUsername(username: string): Promise<User | null>;
  update(id: number, props: Partial<ValidatedUser>): Promise<User | null>;
}
