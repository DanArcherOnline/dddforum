import { type NextFunction, type Request, type Response } from "express";
import { prisma } from "./database/prismaClient";
import { Database } from "./database/database";
import { UserModel } from "./database/userDatabase";
import { PostsModel } from "./database/postsDatabase";
import { ContactListAPIStub } from "./modules/marketing/contactListAPI";
import { TransactionalEmailAPI } from "./modules/notifications/transactionalEmailAPI";
import { UserService } from "./modules/users/userService";
import { PostsService } from "./modules/posts/postsService";
import { MarketingService } from "./modules/marketing/marketingService";
import { UserController } from "./modules/users/userController";
import { PostsController } from "./modules/posts/postsController";
import { MarketingController } from "./modules/marketing/marketingController";
import { errorHandler } from "./shared/errors";
import { Config } from "./shared/config";
import { WebServer } from "./shared/http/webServer";

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;

  private config: Config;
  private dbConnection: Database;
  private userService: UserService;
  private postsService: PostsService;
  private marketingService: MarketingService;
  private userController: UserController;
  private postsController: PostsController;
  private marketingController: MarketingController;
  private webServer: WebServer;

  public static createCompositionRoot(config: Config): CompositionRoot {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new CompositionRoot(config);
    }
    return CompositionRoot.instance;
  }

  private constructor(config: Config) {
    this.config = config;
    this.dbConnection = this.createDBConnection();
    this.userService = this.createUserService();
    this.postsService = this.createPostsService();
    this.marketingService = this.createMarketingService();
    const controllers = this.createControllers();
    this.userController = controllers.userController;
    this.postsController = controllers.postsController;
    this.marketingController = controllers.marketingController;
    this.webServer = this.createWebServer();
  }

  private createDBConnection(): Database {
    const dbConnection = new Database(prisma);
    if (!this.dbConnection) {
      this.dbConnection = dbConnection;
    }
    return dbConnection;
  }

  getDBConnection(): Database {
    if (!this.dbConnection) this.createDBConnection();
    return this.dbConnection;
  }

  private createUserService(): UserService {
    const dbConnection = this.getDBConnection();
    const userModel = new UserModel(dbConnection);
    const transactionalEmailAPI = new TransactionalEmailAPI();
    return new UserService(userModel, transactionalEmailAPI);
  }

  private createPostsService(): PostsService {
    const dbConnection = this.getDBConnection();
    const postsModel = new PostsModel(dbConnection);
    return new PostsService(postsModel);
  }

  private createMarketingService(): MarketingService {
    const contactListAPI = new ContactListAPIStub();
    return new MarketingService(contactListAPI);
  }

  private createControllers() {
    const userController = new UserController(this.userService, errorHandler);
    const postsController = new PostsController(this.postsService, errorHandler);
    const marketingController = new MarketingController(this.marketingService, errorHandler);
    return { userController, postsController, marketingController };
  }

  createWebServer(): WebServer {
    const port = Number(process.env.PORT) || 3000;
    const webServer = new WebServer({ port, env: this.config.env });

    webServer.mountRouter("/users", this.userController.getRouter());
    webServer.mountRouter("/posts", this.postsController.getRouter());
    webServer.mountRouter("/marketing", this.marketingController.getRouter());

    webServer.getApplication().use(
      (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        const rawOrigin = req.headers.origin;
        if (
          typeof rawOrigin === "string" &&
          rawOrigin.length > 0 &&
          res.getHeader("Access-Control-Allow-Origin") === undefined
        ) {
          res.setHeader("Access-Control-Allow-Origin", rawOrigin);
          res.setHeader("Vary", "Origin");
        }
        errorHandler(err, req, res, _next);
      },
    );

    return webServer;
  }

  getWebServer(): WebServer {
    return this.webServer;
  }
}
