import express from "express";
import cors from "cors";
import { Server } from "http";
import { Application } from "../application/applicationInterface";

interface WebServerConfig {
  port: number;
  env: string;
  application?: Application;
}

export class WebServer {
  private express: express.Express;
  private state: "stopped" | "started";
  private instance: Server | undefined;

  constructor(private config: WebServerConfig) {
    this.state = "stopped";
    this.express = express();
    this.initializeServer();
  }

  private initializeServer(): void {
    this.express.use(cors());
    this.express.use(express.json());
  }

  public mountRouter(path: string, router: express.Router): void {
    this.express.use(path, router);
  }

  public getApplication(): express.Express {
    return this.express;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.instance = this.express.listen(this.config.port, () => {
        console.log(`API listening on http://localhost:${this.config.port}`);
        this.state = "started";
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.instance) return reject("Server not started");
      this.instance.close((err) => {
        if (err) return reject("Error stopping the server");
        this.state = "stopped";
        resolve();
      });
    });
  }

  isStarted(): boolean {
    return this.state === "started";
  }
}
