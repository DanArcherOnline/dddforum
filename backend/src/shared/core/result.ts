export type Result<T> = {
  success: boolean;
  error: string;
  data: T | undefined;
};
