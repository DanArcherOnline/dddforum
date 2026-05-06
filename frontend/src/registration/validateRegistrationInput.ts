import { z } from "zod";
import type { RegistrationInput } from "./types";

const registrationSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
});

export type ValidateRegistrationResult =
  | { ok: true; data: RegistrationInput }
  | { ok: false; message: string };

export function validateRegistrationInput(
  input: RegistrationInput,
): ValidateRegistrationResult {
  const result = registrationSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const message =
    result.error.issues[0]?.message ?? "Please check your input.";
  return { ok: false, message };
}
