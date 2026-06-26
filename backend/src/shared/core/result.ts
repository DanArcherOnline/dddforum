export type Result<T> = {
  success: boolean;
  error: string | object;
  data: T | undefined;
};
