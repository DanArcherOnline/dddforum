import { z } from "zod";
import type { CreateUserParams } from "./types";

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
  | { success: true }
  | { success: false; errorMessage: string };

export function validateRegistrationInput(
  input: CreateUserParams,
): ValidateRegistrationResult {
  const result = registrationSchema.safeParse(input);
  if (result.success) {
    return { success: true };
  }
  const errorMessage =
    result.error.issues[0]?.message ?? "Please check your input.";
  return { success: false, errorMessage };
}
