import { StubTransactionalEmailAPI } from "./adapters/stubTransactionalEmailAPI";
import type { TransactionalEmailAPI } from "./ports/transactionalEmailAPI";

export class NotificationsModule {
  private transactionalEmailAPI: TransactionalEmailAPI;

  private constructor() {
    this.transactionalEmailAPI = new StubTransactionalEmailAPI();
  }

  static build() {
    return new NotificationsModule();
  }

  public getTransactionalEmailAPI(): TransactionalEmailAPI {
    return this.transactionalEmailAPI;
  }
}
