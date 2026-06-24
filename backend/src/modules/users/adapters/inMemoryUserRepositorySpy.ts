import type { User } from "../../../generated/prisma/client";
import { Spy } from "../../../shared/testDoubles/spy";
import type { UsersRepository } from "../ports/usersRepository";
import type { CreateUserParams, UpdateUserInput } from "@dddforum/shared/src/api/users";

export class InMemoryUserRepositorySpy
  extends Spy<UsersRepository>
  implements UsersRepository
{
  private users: User[];

  constructor() {
    super();
    this.users = [];
  }

  async save(user: CreateUserParams): Promise<User> {
    this.addCall("save", [user]);
    const newUser: User = {
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      password: "",
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.addCall("findUserByEmail", [email]);
    return Promise.resolve(this.users.find((user) => user.email === email) || null);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    this.addCall("findUserByUsername", [username]);
    return Promise.resolve(this.users.find((user) => user.username === username) || null);
  }

  async update(id: number, props: Partial<UpdateUserInput>): Promise<User | null> {
    this.addCall("update", [id, props]);
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...props };
      return Promise.resolve(this.users[userIndex]);
    }
    return Promise.resolve(null);
  }

  async reset() {
    this.calls = [];
    this.users = [];
  }
}
