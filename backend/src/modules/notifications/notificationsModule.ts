import { StubTransactionalEmailAPI } from "./adapters/stubTransactionalEmailAPI";
import { TransactionalEmailAPISpy } from "./adapters/transactionalEmailAPISpy";
import type { TransactionalEmailAPI } from "./ports/transactionalEmailAPI";
import { Config } from "../../shared/config";

export class NotificationsModule extends Config {
  private transactionalEmailAPI: TransactionalEmailAPI;

  private constructor(config: Config) {
    super(config.script);
    this.transactionalEmailAPI = this.createTransactionalEmailAPI();
  }

  static build(config: Config) {
    return new NotificationsModule(config);
  }

  public createTransactionalEmailAPI(): TransactionalEmailAPI {
    if (this.shouldBuildFakeRepository()) {
      return new TransactionalEmailAPISpy();
    }
    return new StubTransactionalEmailAPI();
  }

  public getTransactionalEmailAPI(): TransactionalEmailAPI {
    return this.transactionalEmailAPI;
  }

  shouldBuildFakeRepository() {
    return (
      this.getScript() === "test:unit" ||
      this.getEnvironment() === "development"
    );
  }
}
