import { Database } from "../../shared/database/database";
import { WebServer } from "../../shared/http/webServer";
import { ProductionUserRepository } from "./adapters/productionUserRepository";
import { InMemoryUserRepositorySpy } from "./adapters/inMemoryUserRepositorySpy";
import { UserService } from "./userService";
import { UserController } from "./userController";
import type { UsersRepository } from "./ports/usersRepository";
import { Config } from "../../shared/config";
import { TransactionalEmailAPI } from "../notifications/ports/transactionalEmailAPI";
import { Application } from "../../shared/application/applicationInterface";

export class UsersModule extends Config {
  private usersRepository: UsersRepository;
  private userService: UserService;

  private constructor(
    private dbConnection: Database,
    private transactionalEmailAPI: TransactionalEmailAPI,
    config: Config,
  ) {
    super(config.script);
    this.usersRepository = this.createUsersRepository();
    this.userService = this.createUserService();
  }

  static build(
    dbConnection: Database,
    transactionalEmailAPI: TransactionalEmailAPI,
    config: Config,
  ) {
    return new UsersModule(dbConnection, transactionalEmailAPI, config);
  }

  shouldBuildFakeRepository() {
    if (this.getScript() === "test:infra") return false;
    return (
      this.getScript() === "test:unit" ||
      this.getEnvironment() === "development"
    );
  }

  private createUsersRepository(): UsersRepository {
    if (this.shouldBuildFakeRepository()) {
      return new InMemoryUserRepositorySpy();
    }
    return new ProductionUserRepository(this.dbConnection.getClient());
  }

  private createUserService() {
    return new UserService(this.usersRepository, this.transactionalEmailAPI);
  }

  public getUserRepository(): UsersRepository {
    return this.usersRepository;
  }

  public getUserService(): UserService {
    return this.userService;
  }

  public mountRouter(webServer: WebServer, application: Application) {
    const controller = new UserController(application);
    webServer.mountRouter("/users", controller.getRouter());
  }
}
