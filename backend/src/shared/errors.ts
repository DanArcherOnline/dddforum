import type { NextFunction, Request, Response } from "express";
import { AppException } from "./exceptions";

export const Errors = {
  EmailAlreadyInUse: "EmailAlreadyInUse",
  UsernameAlreadyTaken: "UsernameAlreadyTaken",
  UserNotFound: "UserNotFound",
  ValidationError: "ValidationError",
  ClientError: "ClientError",
  ServerError: "ServerError",
} as const;

export type ErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export const errorHandler: ErrorHandler = (err, _req, res, _next) => {
  if (err instanceof AppException) {
    res
      .status(err.statusCode)
      .json({ error: { code: err.errorCode }, data: undefined, success: false });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "ServerError" }, data: undefined, success: false });
};
