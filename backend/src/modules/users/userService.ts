import { toPublicUser } from "./userView";
import type { PublicUser } from "./userView";
import type { UsersRepository } from "./ports/usersRepository";
import type {
  CreateUserParams,
  UpdateUserInput,
} from "@dddforum/shared/src/api/users";
import {
  EmailAlreadyInUseException,
  UsernameAlreadyTakenException,
  UserNotFoundException,
} from "../../shared/exceptions";
import { TransactionalEmailAPI } from "../notifications/ports/transactionalEmailAPI";

export class UserService {
  constructor(
    private userRepo: UsersRepository,
    private transactionalEmailAPI: TransactionalEmailAPI,
  ) {}

  async createUser(input: CreateUserParams): Promise<PublicUser> {
    const existingByUsername = await this.userRepo.findUserByUsername(
      input.username,
    );
    if (existingByUsername) throw new UsernameAlreadyTakenException();

    const existingByEmail = await this.userRepo.findUserByEmail(input.email);
    if (existingByEmail) throw new EmailAlreadyInUseException();

    const user = await this.userRepo.save(input);
    await this.transactionalEmailAPI.sendMail(input.email);
    return toPublicUser(user);
  }

  async editUser(userId: number, data: UpdateUserInput): Promise<PublicUser> {
    const user = await this.userRepo.update(userId, data);
    if (!user) throw new UserNotFoundException();
    return toPublicUser(user);
  }

  async getUserByEmail(email: string): Promise<PublicUser> {
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) throw new UserNotFoundException();
    return toPublicUser(user);
  }
}
