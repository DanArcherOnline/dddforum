import { getApiBaseUrl } from "../api";
import type { PublicUser, RegistrationInput } from "../registration/types";

function isPublicUser(value: unknown): value is PublicUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.email === "string" &&
    typeof o.username === "string" &&
    typeof o.firstName === "string" &&
    typeof o.lastName === "string"
  );
}

export async function registerUser(
  input: RegistrationInput,
): Promise<PublicUser> {
  const response = await fetch(`${getApiBaseUrl()}/users/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    console.error("registerUser failed", response.status, body);
    throw new Error("Registration request failed.");
  }

  if (!isPublicUser(body)) {
    console.error("registerUser unexpected response shape", body);
    throw new Error("Registration request failed.");
  }

  return body;
}
