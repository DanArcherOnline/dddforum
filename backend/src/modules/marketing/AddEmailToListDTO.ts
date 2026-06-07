import { InvalidRequestBodyException } from "../../shared/exceptions";

export class AddEmailToListDTO {
  constructor(public readonly email: string) {}

  static fromRequest(body: unknown): AddEmailToListDTO {
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).email !== "string"
    ) {
      throw new InvalidRequestBodyException();
    }
    const { email } = body as Record<string, string>;
    return new AddEmailToListDTO(email);
  }
}
