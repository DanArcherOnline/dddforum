import { WebServer } from "../../shared/http/webServer";
import { ContactListAPIStub } from "./contactListAPI";
import { MarketingService } from "./marketingService";
import { MarketingController } from "./marketingController";
import { errorHandler } from "../../shared/errors";

export class MarketingModule {
  private marketingService: MarketingService;
  private marketingController: MarketingController;

  private constructor() {
    this.marketingService = this.createMarketingService();
    this.marketingController = this.createMarketingController();
  }

  static build() {
    return new MarketingModule();
  }

  private createMarketingService() {
    return new MarketingService(new ContactListAPIStub());
  }

  private createMarketingController() {
    return new MarketingController(this.marketingService, errorHandler);
  }

  public getMarketingController() {
    return this.marketingController;
  }

  public mountRouter(webServer: WebServer) {
    webServer.mountRouter("/marketing", this.marketingController.getRouter());
  }
}
