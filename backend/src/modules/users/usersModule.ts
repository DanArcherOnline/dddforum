import { Database } from "../../shared/database/database";
import { WebServer } from "../../shared/http/webServer";
import { UserModel } from "./userModel";
import { UserService } from "./userService";
import { UserController } from "./userController";
import { NotificationsModule } from "../notifications/notificationsModule";
import { errorHandler } from "../../shared/errors";

export class UsersModule {
  private userService: UserService;
  private userController: UserController;

  private constructor(
    private dbConnection: Database,
    private notificationsModule: NotificationsModule
  ) {
    this.userService = this.createUserService();
    this.userController = this.createUserController();
  }

  static build(dbConnection: Database, notificationsModule: NotificationsModule) {
    return new UsersModule(dbConnection, notificationsModule);
  }

  private createUserService() {
    return new UserService(
      new UserModel(this.dbConnection),
      this.notificationsModule.getTransactionalEmailAPI()
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
