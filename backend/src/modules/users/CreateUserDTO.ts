import type { CreateUserParams } from "@dddforum/shared/src/api/users";
import { InvalidRequestBodyException } from "../../shared/exceptions";

export class CreateUserDTO implements CreateUserParams {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly username: string,
  ) {}

  static fromRequest(body: unknown): CreateUserDTO {
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).firstName !== "string" ||
      typeof (body as Record<string, unknown>).lastName !== "string" ||
      typeof (body as Record<string, unknown>).email !== "string" ||
      typeof (body as Record<string, unknown>).username !== "string"
    ) {
      throw new InvalidRequestBodyException();
    }
    const { firstName, lastName, email, username } = body as Record<string, string>;
    return new CreateUserDTO(firstName, lastName, email, username);
  }
}
