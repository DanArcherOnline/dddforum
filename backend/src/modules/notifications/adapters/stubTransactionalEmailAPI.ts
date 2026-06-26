import type { SendMailInput, TransactionalEmailAPI } from "../ports/transactionalEmailAPI";

export class StubTransactionalEmailAPI implements TransactionalEmailAPI {
  async sendMail(input: SendMailInput): Promise<boolean> {
    console.log(`StubTransactionalEmailAPI: Sending email to ${input.to}...`);
    return true;
  }
}
