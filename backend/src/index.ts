import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { prisma } from "./database/prismaClient";
import { UserDatabase } from "./database/userDatabase";
import { PostsDatabase } from "./database/postsDatabase";
import { ContactListAPIStub } from "./modules/marketing/contactListAPI";
import { TransactionalEmailAPI } from "./modules/notifications/transactionalEmailAPI";
import { UserService } from "./modules/users/userService";
import { PostsService } from "./modules/posts/postsService";
import { MarketingService } from "./modules/marketing/marketingService";
import { UserController } from "./modules/users/userController";
import { PostsController } from "./modules/posts/postsController";
import { MarketingController } from "./modules/marketing/marketingController";
import { errorHandler } from "./shared/errors";

export const app = express();

const corsOptions: cors.CorsOptions =
  process.env.NODE_ENV === "production"
    ? {
        origin: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : false,
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }
    : {
        origin: true,
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      };

app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  app.get("/", (_req, res) => {
    res.redirect(302, `${frontendOrigin}/`);
  });
}

const userDatabase = new UserDatabase();
const postsDatabase = new PostsDatabase();
const contactListAPI = new ContactListAPIStub();
const transactionalEmailAPI = new TransactionalEmailAPI();

const userService = new UserService(userDatabase, transactionalEmailAPI);
const postsService = new PostsService(postsDatabase);
const marketingService = new MarketingService(contactListAPI);

const userController = new UserController(userService, errorHandler);
const postsController = new PostsController(postsService, errorHandler);
const marketingController = new MarketingController(
  marketingService,
  errorHandler,
);

app.use("/users", userController.getRouter());
app.use("/posts", postsController.getRouter());
app.use("/marketing", marketingController.getRouter());

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
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

const port = process.env.PORT || 3000;

async function start(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (cause) {
    console.error(
      `Could not connect to PostgreSQL (${String(cause)}).\n` +
        "From the backend folder run:\n" +
        "  docker compose up -d --wait\n" +
        "  npx prisma migrate deploy\n",
    );
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    if (process.env.NODE_ENV !== "production") {
      const ui = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
      console.log(`Web app (Vite): ${ui}`);
    }
  });
}

if (require.main === module) {
  void start();
}
