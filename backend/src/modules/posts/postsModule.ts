import { Database } from "../../shared/database/database";
import { WebServer } from "../../shared/http/webServer";
import { ProductionPostsRepository } from "./adapters/productionPostsRepository";
import { PostsService } from "./postsService";
import { PostsController } from "./postsController";
import { errorHandler } from "../../shared/errors";

export class PostsModule {
  private postsService: PostsService;
  private postsController: PostsController;

  private constructor(private dbConnection: Database) {
    this.postsService = this.createPostsService();
    this.postsController = this.createPostsController();
  }

  static build(dbConnection: Database) {
    return new PostsModule(dbConnection);
  }

  private createPostsService() {
    return new PostsService(new ProductionPostsRepository(this.dbConnection.getClient()));
  }

  private createPostsController() {
    return new PostsController(this.postsService, errorHandler);
  }

  public getPostsService(): PostsService {
    return this.postsService;
  }

  public getPostsController() {
    return this.postsController;
  }

  public mountRouter(webServer: WebServer) {
    webServer.mountRouter("/posts", this.postsController.getRouter());
  }
}
