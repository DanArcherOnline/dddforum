import express from 'express';
import { Application } from '../../shared/application/applicationInterface';
import type { AddEmailToListResponse } from '@dddforum/shared/src/api/marketing';

export class MarketingController {
  private router: express.Router;

  constructor(private application: Application) {
    this.router = express.Router();
    this.setupRoutes();
  }

  getRouter() {
    return this.router;
  }

  private setupRoutes() {
    this.router.post("/new", this.addEmailToList);
  }

  private addEmailToList = async (
    req: express.Request,
    res: express.Response,
  ) => {
    const email: string = req.body.email;
    const result = await this.application.marketing.addEmailToList(email);
    const response: AddEmailToListResponse = { success: true, data: result, error: {} };
    res.status(201).json(response);
  };
}
