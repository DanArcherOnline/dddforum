import type { UpdateUserInput } from "@dddforum/shared/src/api/users";
import { InvalidRequestBodyException } from "../../shared/exceptions";

export class UpdateUserDTO implements UpdateUserInput {
  constructor(
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly username?: string,
  ) {}

  static fromRequest(body: unknown): UpdateUserDTO {
    if (typeof body !== "object" || body === null) {
      throw new InvalidRequestBodyException();
    }
    const b = body as Record<string, unknown>;
    const dto = new UpdateUserDTO(
      typeof b.firstName === "string" ? b.firstName : undefined,
      typeof b.lastName === "string" ? b.lastName : undefined,
      typeof b.email === "string" ? b.email : undefined,
      typeof b.username === "string" ? b.username : undefined,
    );
    if (
      dto.firstName === undefined &&
      dto.lastName === undefined &&
      dto.email === undefined &&
      dto.username === undefined
    ) {
      throw new InvalidRequestBodyException();
    }
    return dto;
  }
}
