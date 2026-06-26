import express from 'express';
import { Errors } from '../../shared/errors';
import { CreateUserParams, UpdateUserInput } from '@dddforum/shared/src/api/users';
import { Application } from '../../shared/application/applicationInterface';

export class UserController {
  private router: express.Router;

  constructor(private application: Application) {
    this.router = express.Router();
    this.setupRoutes();
  }

  getRouter() {
    return this.router;
  }

  private setupRoutes() {
    this.router.post("/new", this.createUser);
    this.router.post("/edit/:userId", this.editUser);
    this.router.get("/", this.getUserByEmail);
  }

  private createUser = async (req: express.Request, res: express.Response) => {
    const command: CreateUserParams = req.body;
    const result = await this.application.users.createUser(command);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      switch (result.error) {
        case Errors.EmailAlreadyInUse:
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result);
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result);
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  };

  private editUser = async (req: express.Request, res: express.Response) => {
    const command: UpdateUserInput & { id: number } = {
      ...req.body,
      id: Number(req.params.userId),
    };
    const result = await this.application.users.editUser(command.id, command);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      switch (result.error) {
        case Errors.EmailAlreadyInUse:
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result);
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result);
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  };

  private getUserByEmail = async (req: express.Request, res: express.Response) => {
    const email = req.query.email as string;

    const result = await this.application.users.getUserByEmail(email);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      switch (result.error) {
        case Errors.UserNotFound:
          return res.status(404).json(result);
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result);
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result);
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  };
}
