import { Database } from "../../shared/database/database";
import { WebServer } from "../../shared/http/webServer";
import { ProductionUserRepository } from "./adapters/productionUserRepository";
import { InMemoryUserRepository } from "./adapters/inMemoryUserRepository";
import { UserService } from "./userService";
import { UserController } from "./userController";
import type { TransactionalEmailAPI } from "../notifications/transactionalEmailAPI";
import type { UsersRepository } from "./ports/usersRepository";
import { errorHandler } from "../../shared/errors";
import { Config } from "../../shared/config";

export class UsersModule extends Config {
  private usersRepository: UsersRepository;
  private userService: UserService;
  private userController: UserController;

  private constructor(
    private dbConnection: Database,
    private transactionalEmailAPI: TransactionalEmailAPI,
    config: Config,
  ) {
    super(config.script);
    this.usersRepository = this.createUsersRepository();
    this.userService = this.createUserService();
    this.userController = this.createUserController();
  }

  static build(dbConnection: Database, transactionalEmailAPI: TransactionalEmailAPI, config: Config) {
    return new UsersModule(dbConnection, transactionalEmailAPI, config);
  }

  shouldBuildFakeRepository() {
    return (
      this.getScript() === "test:unit" ||
      this.getEnvironment() === "development"
    );
  }

  private createUsersRepository(): UsersRepository {
    if (this.shouldBuildFakeRepository()) {
      return new InMemoryUserRepository();
    }
    return new ProductionUserRepository(this.dbConnection.getClient());
  }

  private createUserService() {
    return new UserService(this.usersRepository, this.transactionalEmailAPI);
  }

  private createUserController() {
    return new UserController(this.userService, errorHandler);
  }

  public getUserRepository(): UsersRepository {
    return this.usersRepository;
  }

  public getUserService(): UserService {
    return this.userService;
  }

  public getUserController() {
    return this.userController;
  }

  public mountRouter(webServer: WebServer) {
    webServer.mountRouter("/users", this.userController.getRouter());
  }
}
