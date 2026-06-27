import type { User } from "../../../generated/prisma/client";
import type { UsersRepository } from "../ports/usersRepository";
import type { CreateUserParams, UpdateUserInput } from "@dddforum/shared/src/api/users";

export class InMemoryUserRepository implements UsersRepository {
  private users: User[] = [];
  private nextId = 1;

  async save(user: CreateUserParams): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      password: "",
    };
    this.users.push(newUser);
    return newUser;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.users.find((u) => u.username === username) ?? null;
  }

  async update(id: number, props: UpdateUserInput): Promise<User | null> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...props };
    return this.users[index];
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async delete(email: string): Promise<void> {
    this.users = this.users.filter((u) => u.email !== email);
  }

  async reset(): Promise<void> {
    this.users = [];
    this.nextId = 1;
  }
}
