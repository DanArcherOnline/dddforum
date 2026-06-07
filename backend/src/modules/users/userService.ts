import { toPublicUser } from "../../views/users/userView";
import type { PublicUser } from "../../views/users/userView";
import type { UserDatabase } from "../../database/userDatabase";
import type { CreateUserInput, UpdateUserInput } from "@dddforum/shared/src/api/users";
import type { TransactionalEmailAPI } from "../notifications/transactionalEmailAPI";
import {
  EmailAlreadyInUseException,
  UsernameAlreadyTakenException,
  UserNotFoundException,
} from "../../shared/exceptions";

export class UserService {
  constructor(
    private userDatabase: UserDatabase,
    private transactionalEmailAPI: TransactionalEmailAPI,
  ) {}

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const existingByUsername = await this.userDatabase.findByUsername(input.username);
    if (existingByUsername) throw new UsernameAlreadyTakenException();

    const existingByEmail = await this.userDatabase.findByEmail(input.email);
    if (existingByEmail) throw new EmailAlreadyInUseException();

    try {
      const user = await this.userDatabase.createUser(input);
      await this.transactionalEmailAPI.sendWelcomeEmail(input.email);
      return toPublicUser(user);
    } catch (error) {
      if (this.userDatabase.isUniqueConstraintError(error)) throw new EmailAlreadyInUseException();
      throw error;
    }
  }

  async editUser(userId: number, data: UpdateUserInput): Promise<PublicUser> {
    try {
      const user = await this.userDatabase.updateUser(userId, data);
      return toPublicUser(user);
    } catch (error) {
      if (this.userDatabase.isNotFoundError(error)) throw new UserNotFoundException();
      if (this.userDatabase.isUniqueConstraintError(error)) throw new EmailAlreadyInUseException();
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<PublicUser> {
    const user = await this.userDatabase.findByEmail(email);
    if (!user) throw new UserNotFoundException();
    return toPublicUser(user);
  }
}
