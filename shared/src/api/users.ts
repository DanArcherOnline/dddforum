export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}

export interface UserDTO {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: UserDTO;
  error: {};
}

export interface GetUserResponse {
  success: boolean;
  data: UserDTO;
  error: {};
}
