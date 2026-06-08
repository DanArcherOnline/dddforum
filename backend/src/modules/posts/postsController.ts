import express from "express";
import type { PostsService } from "./postsService";
import type { ErrorHandler } from "../../shared/errors";
import type { GetPopularPostsResponse } from "@dddforum/shared/src/api/posts";

export class PostsController {
  private router: express.Router;

  constructor(
    private postsService: PostsService,
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
    this.router.get("/popular", this.getPopularPosts);
  }

  private setupErrorHandler() {
    this.router.use(this.errorHandler);
  }

  private getPopularPosts = async (
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const prismaPosts = await this.postsService.getPopularPosts();
      const posts = prismaPosts.map((p) => ({
        ...p,
        dateCreated: p.dateCreated.toISOString(),
      }));
      const response: GetPopularPostsResponse = { error: {}, data: { posts }, success: true };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
