import { Router } from "express";
import * as postController from "../controllers/postController";

const router = Router();

router.get("/posts/popular", (req, res, next) => {
  void postController.getPopularPosts(req, res).catch(next);
});

export { router as postRoutes };
