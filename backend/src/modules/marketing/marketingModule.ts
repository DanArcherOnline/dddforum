import { WebServer } from "../../shared/http/webServer";
import { MailchimpContactList } from "./adapters/mailchimpContactList";
import { ContactListAPISpy } from "./adapters/contactListAPISpy";
import { MarketingService } from "./marketingService";
import { MarketingController } from "./marketingController";
import type { ContactListAPI } from "./ports/contactListAPI";
import { errorHandler } from "../../shared/errors";
import { Config } from "../../shared/config";

export class MarketingModule extends Config {
  private contactListAPI: ContactListAPI;
  private marketingService: MarketingService;
  private marketingController: MarketingController;

  private constructor(config: Config) {
    super(config.script);
    this.contactListAPI = this.createContactListAPI();
    this.marketingService = this.createMarketingService();
    this.marketingController = this.createMarketingController();
  }

  static build(config: Config) {
    return new MarketingModule(config);
  }

  shouldBuildFakeRepository() {
    return (
      this.getScript() === "test:unit" ||
      this.getEnvironment() === "development"
    );
  }

  private createContactListAPI(): ContactListAPI {
    if (this.shouldBuildFakeRepository()) {
      return new ContactListAPISpy();
    }
    return new MailchimpContactList();
  }

  private createMarketingService() {
    return new MarketingService(this.contactListAPI);
  }

  private createMarketingController() {
    return new MarketingController(this.marketingService, errorHandler);
  }

  public getContactListAPI(): ContactListAPI {
    return this.contactListAPI;
  }

  public getMarketingService(): MarketingService {
    return this.marketingService;
  }

  public getMarketingController() {
    return this.marketingController;
  }

  public mountRouter(webServer: WebServer) {
    webServer.mountRouter("/marketing", this.marketingController.getRouter());
  }
}
