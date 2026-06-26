import { toPublicUser } from "./userView";
import type { PublicUser } from "./userView";
import type { UsersRepository } from "./ports/usersRepository";
import type { CreateUserParams, UpdateUserInput, ValidatedUser } from "@dddforum/shared/src/api/users";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";
import { Errors } from "../../shared/errors";
import { TransactionalEmailAPI } from "../notifications/ports/transactionalEmailAPI";
import type { Result } from "../../shared/core/result";

export class UserService {
  constructor(
    private userRepo: UsersRepository,
    private transactionalEmailAPI: TransactionalEmailAPI,
  ) {}

  async createUser(input: CreateUserParams): Promise<Result<PublicUser>> {
    try {
      const existingByUsername = await this.userRepo.findUserByUsername(
        input.username,
      );
      if (existingByUsername) {
        return {
          success: false,
          error: Errors.UsernameAlreadyTaken,
          data: undefined,
        };
      }

      const existingByEmail = await this.userRepo.findUserByEmail(input.email);
      if (existingByEmail) {
        return {
          success: false,
          error: Errors.EmailAlreadyInUse,
          data: undefined,
        };
      }

      const validatedUser: ValidatedUser = {
        ...input,
        password: TextUtil.createRandomText(10),
      };

      const user = await this.userRepo.save(validatedUser);

      await this.transactionalEmailAPI.sendMail({
        to: validatedUser.email,
        subject: "Your login details to DDDForum",
        text: `Welcome to DDDForum. You can login with the following details </br>
      email: ${validatedUser.email}
      password: ${validatedUser.password}`,
      });

      return { success: true, error: {}, data: toPublicUser(user) };
    } catch {
      return { success: false, error: Errors.ServerError, data: undefined };
    }
  }

  async editUser(
    userId: number,
    data: UpdateUserInput,
  ): Promise<Result<PublicUser>> {
    try {
      const user = await this.userRepo.update(userId, data);
      if (!user) {
        return { success: false, error: Errors.UserNotFound, data: undefined };
      }
      return { success: true, error: {}, data: toPublicUser(user) };
    } catch {
      return { success: false, error: Errors.ServerError, data: undefined };
    }
  }

  async getUserByEmail(email: string): Promise<Result<PublicUser>> {
    try {
      const user = await this.userRepo.findUserByEmail(email);
      if (!user) {
        return { success: false, error: Errors.UserNotFound, data: undefined };
      }
      return { success: true, error: {}, data: toPublicUser(user) };
    } catch {
      return { success: false, error: Errors.ServerError, data: undefined };
    }
  }
}
