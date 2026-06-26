import type { User } from "../../../generated/prisma/client";
import { Spy } from "../../../shared/testDoubles/spy";
import type { UsersRepository } from "../ports/usersRepository";
import type { ValidatedUser } from "@dddforum/shared/src/api/users";

export class InMemoryUserRepositorySpy
  extends Spy<UsersRepository>
  implements UsersRepository
{
  private users: User[];

  constructor() {
    super();
    this.users = [];
  }

  async save(user: ValidatedUser): Promise<User> {
    this.addCall("save", [user]);
    const newUser: User = {
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      password: user.password,
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.addCall("findUserByEmail", [email]);
    return Promise.resolve(this.users.find((user) => user.email === email) || null);
  }

  async findById(id: number): Promise<User | null> {
    this.addCall("findById", [id]);
    return Promise.resolve(this.users.find((user) => user.id === id) || null);
  }

  async delete(email: string): Promise<void> {
    this.addCall("delete", [email]);
    const index = this.users.findIndex((user) => user.email === email);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    this.addCall("findUserByUsername", [username]);
    return Promise.resolve(this.users.find((user) => user.username === username) || null);
  }

  async update(id: number, props: Partial<ValidatedUser>): Promise<User | null> {
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
