import { toPublicUser } from "./userView";
import type { PublicUser } from "./userView";
import type { UserModel } from "./userModel";
import type { CreateUserInput, UpdateUserInput } from "@dddforum/shared/src/api/users";
import type { TransactionalEmailAPI } from "../notifications/transactionalEmailAPI";
import {
  EmailAlreadyInUseException,
  UsernameAlreadyTakenException,
  UserNotFoundException,
} from "../../shared/exceptions";

export class UserService {
  constructor(
    private userModel: UserModel,
    private transactionalEmailAPI: TransactionalEmailAPI,
  ) {}

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const existingByUsername = await this.userModel.findByUsername(input.username);
    if (existingByUsername) throw new UsernameAlreadyTakenException();

    const existingByEmail = await this.userModel.findByEmail(input.email);
    if (existingByEmail) throw new EmailAlreadyInUseException();

    try {
      const user = await this.userModel.createUser(input);
      await this.transactionalEmailAPI.sendWelcomeEmail(input.email);
      return toPublicUser(user);
    } catch (error) {
      if (this.userModel.isUniqueConstraintError(error)) throw new EmailAlreadyInUseException();
      throw error;
    }
  }

  async editUser(userId: number, data: UpdateUserInput): Promise<PublicUser> {
    try {
      const user = await this.userModel.updateUser(userId, data);
      return toPublicUser(user);
    } catch (error) {
      if (this.userModel.isNotFoundError(error)) throw new UserNotFoundException();
      if (this.userModel.isUniqueConstraintError(error)) throw new EmailAlreadyInUseException();
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<PublicUser> {
    const user = await this.userModel.findByEmail(email);
    if (!user) throw new UserNotFoundException();
    return toPublicUser(user);
  }
}
