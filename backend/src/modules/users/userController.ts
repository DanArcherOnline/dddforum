import express from "express";
import type { UserService } from "./userService";
import type { ErrorHandler } from "../../shared/errors";
import { CreateUserDTO } from "./CreateUserDTO";
import { UpdateUserDTO } from "./UpdateUserDTO";
import type { CreateUserResponse, GetUserResponse } from "@dddforum/shared/src/api/users";

export class UserController {
  private router: express.Router;

  constructor(
    private userService: UserService,
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
    this.router.post("/new", this.createNew);
    this.router.post("/edit/:userId", this.editUser);
    this.router.get("/", this.getByEmail);
  }

  private setupErrorHandler() {
    this.router.use(this.errorHandler);
  }

  private parseUserId(param: string | string[] | undefined): number | null {
    const raw = Array.isArray(param) ? param[0] : param;
    if (raw === undefined) return null;
    const id = Number.parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private createNew = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const dto = CreateUserDTO.fromRequest(req.body);
      const user = await this.userService.createUser(dto);
      const response: CreateUserResponse = { success: true, error: {}, data: user };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  private editUser = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const userId = this.parseUserId(req.params.userId);
      if (userId === null) {
        res.status(400).json({ error: "invalid user id" });
        return;
      }
      const dto = UpdateUserDTO.fromRequest(req.body);
      const user = await this.userService.editUser(userId, dto);
      const response: GetUserResponse = { success: true, error: {}, data: user };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  private getByEmail = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const raw = req.query.email;
      const email = Array.isArray(raw) ? raw[0] : raw;
      if (typeof email !== "string" || email.length === 0) {
        res.status(400).json({ error: "query parameter email is required" });
        return;
      }
      const user = await this.userService.getUserByEmail(email);
      const response: GetUserResponse = { success: true, error: {}, data: user };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
