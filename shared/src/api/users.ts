import { APIResponse, GenericErrors, ServerError } from "./types";

export type CreateUserParams = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

export type CreateUserInput = CreateUserParams;

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

export type UserNotFoundError = "UserNotFound";
export type GetUserByEmailErrors = ServerError | UserNotFoundError;
export type GetUserByEmailResponse = APIResponse<User, GetUserByEmailErrors>;
export type GetUserErrors = GetUserByEmailErrors | CreateUserErrors;
export type GetUserResponse = GetUserByEmailResponse;

export type UserResponse = APIResponse<
  CreateUserResponse | GetUserByEmailResponse | null,
  GetUserErrors
>;

export const createUsersAPI = (apiURL: string) => {
  return {
    register: async (input: CreateUserParams): Promise<CreateUserResponse> => {
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
