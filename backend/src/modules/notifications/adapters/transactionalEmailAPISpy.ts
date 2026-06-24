import { Spy } from "../../../shared/testDoubles/spy";
import type { TransactionalEmailAPI } from "../ports/transactionalEmailAPI";

export class TransactionalEmailAPISpy
  extends Spy<TransactionalEmailAPI>
  implements TransactionalEmailAPI
{
  constructor() {
    super();
  }

  async sendMail(input: string): Promise<void> {
    this.addCall("sendMail", [input]);
  }
}
