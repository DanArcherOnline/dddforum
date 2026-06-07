import express from "express";
import type { MarketingService } from "./marketingService";
import type { ErrorHandler } from "../../shared/errors";
import { AddEmailToListDTO } from "../../views/marketing/AddEmailToListDTO";
import type { AddEmailToListResponse } from "@dddforum/shared/src/api/marketing";

export class MarketingController {
  private router: express.Router;

  constructor(
    private marketingService: MarketingService,
    private errorHandler: ErrorHandler,
  ) {
    this.router = express.Router();
    this.setupRoutes();
    this.setupErrorHandler();
  }

  getRouter() {
    return this.router;
  }

  private setupRoutes() {
    this.router.post("/new", this.addEmailToList);
  }

  private setupErrorHandler() {
    this.router.use(this.errorHandler);
  }

  private addEmailToList = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const dto = AddEmailToListDTO.fromRequest(req.body);
      const result = await this.marketingService.addEmailToList(dto.email);
      const response: AddEmailToListResponse = { success: true, data: result, error: {} };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
