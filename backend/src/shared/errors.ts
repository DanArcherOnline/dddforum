import type { NextFunction, Request, Response } from "express";
import { AppException } from "./exceptions";

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
      .json({ error: err.errorCode, data: undefined, success: false });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "ServerError", data: undefined, success: false });
};
