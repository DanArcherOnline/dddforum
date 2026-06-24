import { Database } from "../../shared/database/database";
import { WebServer } from "../../shared/http/webServer";
import { ProductionUserRepository } from "./adapters/productionUserRepository";
import { UserService } from "./userService";
import { UserController } from "./userController";
import type { TransactionalEmailAPI } from "../notifications/transactionalEmailAPI";
import { errorHandler } from "../../shared/errors";

export class UsersModule {
  private userService: UserService;
  private userController: UserController;

  private constructor(
    private dbConnection: Database,
    private transactionalEmailAPI: TransactionalEmailAPI
  ) {
    this.userService = this.createUserService();
    this.userController = this.createUserController();
  }

  static build(dbConnection: Database, transactionalEmailAPI: TransactionalEmailAPI) {
    return new UsersModule(dbConnection, transactionalEmailAPI);
  }

  private createUserService() {
    return new UserService(
      new ProductionUserRepository(this.dbConnection.getClient()),
      this.transactionalEmailAPI
    );
  }

  private createUserController() {
    return new UserController(this.userService, errorHandler);
  }

  public getUserController() {
    return this.userController;
  }

  public mountRouter(webServer: WebServer) {
    webServer.mountRouter("/users", this.userController.getRouter());
  }
}
