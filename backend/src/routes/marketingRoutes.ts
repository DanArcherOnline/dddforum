import { Router } from "express";
import * as marketingController from "../controllers/marketingController";

const router = Router();

router.post("/marketing/new", (req, res, next) => {
  void marketingController.addEmailToList(req, res).catch(next);
});

export { router as marketingRoutes };
