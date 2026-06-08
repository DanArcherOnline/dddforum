import { type NextFunction, type Request, type Response } from "express";
import { Config } from "./config";
import { SharedModule } from "./sharedModule";
import { NotificationsModule } from "../modules/notifications/notificationsModule";
import { PostsModule } from "../modules/posts/postsModule";
import { UsersModule } from "../modules/users/usersModule";
import { MarketingModule } from "../modules/marketing/marketingModule";
import { errorHandler } from "./errors";

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;

  private config: Config;
  private sharedModule: SharedModule;
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
    this.sharedModule = SharedModule.build(config);
    this.notificationsModule = NotificationsModule.build();
    this.postsModule = PostsModule.build(this.sharedModule.getDBConnection());
    this.usersModule = UsersModule.build(this.sharedModule.getDBConnection(), this.notificationsModule);
    this.marketingModule = MarketingModule.build();
    this.mountRoutes();
  }

  private mountRoutes() {
    const webServer = this.sharedModule.getWebServer();
    this.postsModule.mountRouter(webServer);
    this.usersModule.mountRouter(webServer);
    this.marketingModule.mountRouter(webServer);

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
  }

  getWebServer() {
    return this.sharedModule.getWebServer();
  }

  getDBConnection() {
    return this.sharedModule.getDBConnection();
  }
}
