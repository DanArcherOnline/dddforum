import { Config } from "./config";
import { Database } from "./database/database";
import { WebServer } from "./http/webServer";
import { prisma } from "./database/prismaClient";

export class SharedModule {
  private dbConnection: Database;
  private webServer: WebServer;

  private constructor(private config: Config) {
    this.dbConnection = new Database(prisma);
    this.webServer = new WebServer({ port: Number(process.env.PORT) || 3000, env: config.env });
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
