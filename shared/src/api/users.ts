import { APIResponse, GenericErrors } from "./types";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
};

export type User = {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
};

export type EmailAlreadyInUseError = "EmailAlreadyInUse";
export type UsernameAlreadyTakenError = "UsernameAlreadyTaken";
export type CreateUserErrors =
  | GenericErrors
  | EmailAlreadyInUseError
  | UsernameAlreadyTakenError;
export type CreateUserResponse = APIResponse<User, CreateUserErrors>;
export type GetUserByEmailResponse = APIResponse<User, GenericErrors>;
export type GetUserResponse = GetUserByEmailResponse;

export const createUsersAPI = (apiURL: string) => {
  return {
    register: async (input: CreateUserInput): Promise<CreateUserResponse> => {
      try {
        const successResponse = await fetch(`${apiURL}/users/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input }),
        });
        if (!successResponse.ok) throw successResponse;
        return (await successResponse.json()) as CreateUserResponse;
      } catch (err: any) {
        return (await err.json()) as CreateUserResponse;
      }
    },
    getUserByEmail: async (email: string): Promise<GetUserByEmailResponse> => {
      try {
        const successResponse = await fetch(
          `${apiURL}/users?email=${encodeURIComponent(email)}`,
        );
        if (!successResponse.ok) throw successResponse;
        return (await successResponse.json()) as GetUserByEmailResponse;
      } catch (err: any) {
        return (await err.json()) as GetUserByEmailResponse;
      }
    },
  };
};
