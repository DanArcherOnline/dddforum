import type { User } from "../../generated/prisma/client";

export type PublicUser = Omit<User, "password">;

export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}
