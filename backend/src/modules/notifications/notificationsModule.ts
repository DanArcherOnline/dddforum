import { TransactionalEmailAPI } from "./transactionalEmailAPI";

export class NotificationsModule {
  private transactionalEmailAPI: TransactionalEmailAPI;

  private constructor() {
    this.transactionalEmailAPI = new TransactionalEmailAPI();
  }

  static build() {
    return new NotificationsModule();
  }

  public getTransactionalEmailAPI() {
    return this.transactionalEmailAPI;
  }
}
