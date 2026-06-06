import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { prisma } from "./database/prismaClient";
import { postRoutes } from "./routes/postRoutes";
import { userRoutes } from "./routes/userRoutes";
import { marketingRoutes } from "./routes/marketingRoutes";

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

function applyCorsFromRequest(req: Request, res: Response): void {
  const rawOrigin = req.headers.origin;
  if (
    typeof rawOrigin === "string" &&
    rawOrigin.length > 0 &&
    res.getHeader("Access-Control-Allow-Origin") === undefined
  ) {
    res.setHeader("Access-Control-Allow-Origin", rawOrigin);
    res.setHeader("Vary", "Origin");
  }
}

if (process.env.NODE_ENV !== "production") {
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  app.get("/", (_req, res) => {
    res.redirect(302, `${frontendOrigin}/`);
  });
}

app.use(postRoutes);
app.use(userRoutes);
app.use(marketingRoutes);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  applyCorsFromRequest(req, res);
  if (!res.headersSent) {
    res.status(500).json({
      error: "ServerError",
      data: undefined,
      success: false,
    });
  }
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
