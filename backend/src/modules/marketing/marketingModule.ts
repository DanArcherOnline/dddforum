import { WebServer } from "../../shared/http/webServer";
import { MailchimpContactList } from "./adapters/mailchimpContactList";
import { ContactListAPISpy } from "./adapters/contactListAPISpy";
import { MarketingService } from "./marketingService";
import { MarketingController } from "./marketingController";
import type { ContactListAPI } from "./ports/contactListAPI";
import { Config } from "../../shared/config";
import { Application } from "../../shared/application/applicationInterface";

export class MarketingModule extends Config {
  private contactListAPI: ContactListAPI;
  private marketingService: MarketingService;

  private constructor(config: Config) {
    super(config.script);
    this.contactListAPI = this.createContactListAPI();
    this.marketingService = this.createMarketingService();
  }

  static build(config: Config) {
    return new MarketingModule(config);
  }

  shouldBuildFakeRepository() {
    if (this.getScript() === "test:infra") return false;
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

  public getContactListAPI(): ContactListAPI {
    return this.contactListAPI;
  }

  public getMarketingService(): MarketingService {
    return this.marketingService;
  }

  public mountRouter(webServer: WebServer, application: Application) {
    const controller = new MarketingController(application);
    webServer.mountRouter("/marketing", controller.getRouter());
  }
}
