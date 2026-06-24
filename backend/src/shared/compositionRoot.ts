import { type NextFunction, type Request, type Response } from "express";
import { Config } from "./config";
import { Database } from "./database/database";
import { WebServer } from "./http/webServer";
import { prisma } from "./database/prismaClient";
import { NotificationsModule } from "../modules/notifications/notificationsModule";
import { PostsModule } from "../modules/posts/postsModule";
import { UsersModule } from "../modules/users/usersModule";
import { MarketingModule } from "../modules/marketing/marketingModule";
import type { UsersRepository } from "../modules/users/ports/usersRepository";
import type { ContactListAPI } from "../modules/marketing/ports/contactListAPI";
import type { UserService } from "../modules/users/userService";
import type { MarketingService } from "../modules/marketing/marketingService";
import { errorHandler } from "./errors";
import { TransactionalEmailAPI } from "../modules/notifications/ports/transactionalEmailAPI";

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;

  private config: Config;
  private webServer: WebServer;
  private dbConnection: Database;
  private notificationsModule: NotificationsModule;
  private postsModule: PostsModule;
  private usersModule: UsersModule;
  private marketingModule: MarketingModule;

  public static createCompositionRoot(config: Config): CompositionRoot {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new CompositionRoot(config);
    }
    return CompositionRoot.instance;
  }

  private constructor(config: Config) {
    this.config = config;
    this.dbConnection = this.createDBConnection();
    this.notificationsModule = this.createNotificationsModule();
    this.marketingModule = this.createMarketingModule();
    this.usersModule = this.createUsersModule();
    this.postsModule = this.createPostsModule();
    this.webServer = this.createWebServer();
    this.mountRoutes();
  }

  private createDBConnection() {
    return new Database(prisma);
  }

  public createNotificationsModule() {
    return NotificationsModule.build(this.config);
  }

  public createMarketingModule() {
    return MarketingModule.build(this.config);
  }

  public createUsersModule() {
    return UsersModule.build(
      this.dbConnection,
      this.notificationsModule.getTransactionalEmailAPI(),
      this.config,
    );
  }

  public createPostsModule() {
    return PostsModule.build(this.dbConnection);
  }

  public createWebServer() {
    const port =
      this.config.script === "test:e2e"
        ? 3001
        : Number(process.env.PORT) || 3000;
    return new WebServer({ port, env: this.config.env });
  }

  private mountRoutes() {
    this.postsModule.mountRouter(this.webServer);
    this.usersModule.mountRouter(this.webServer);
    this.marketingModule.mountRouter(this.webServer);

    this.webServer
      .getApplication()
      .use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
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
      });
  }

  getWebServer() {
    return this.webServer;
  }

  getDBConnection() {
    return this.dbConnection;
  }

  getRepositories(): {
    users: UsersRepository;
    contactList: ContactListAPI;
    transactionalEmail: TransactionalEmailAPI;
  } {
    return {
      users: this.usersModule.getUserRepository(),
      contactList: this.marketingModule.getContactListAPI(),
      transactionalEmail:
        this.notificationsModule.getTransactionalEmailAPI(),
    };
  }

  getApplication(): { users: UserService; marketing: MarketingService } {
    return {
      users: this.usersModule.getUserService(),
      marketing: this.marketingModule.getMarketingService(),
    };
  }
}
