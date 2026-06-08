export type Error<U> = {
  message?: string;
  code?: U;
};

export type APIResponse<T, U> = {
  success: boolean;
  data: T;
  error: Error<U>;
};

export type ValidationError = "ValidationError";
export type ServerError = "ServerError";
export type GenericErrors = ValidationError | ServerError;
