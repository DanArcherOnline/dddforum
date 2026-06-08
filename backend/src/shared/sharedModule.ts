import { Config } from "./config";
import { Database } from "./database/database";
import { WebServer } from "./http/webServer";
import { prisma } from "./database/prismaClient";

export class SharedModule {
  private dbConnection: Database;
  private webServer: WebServer;

  private constructor(config: Config) {
    this.dbConnection = new Database(prisma);
    const port = config.script === "test:e2e" ? 3001 : Number(process.env.PORT) || 3000;
    this.webServer = new WebServer({ port, env: config.env });
  }

  static build(config: Config) {
    return new SharedModule(config);
  }

  public getDBConnection() {
    return this.dbConnection;
  }

  public getWebServer() {
    return this.webServer;
  }
}
