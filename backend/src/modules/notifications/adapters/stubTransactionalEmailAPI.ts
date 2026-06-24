import type { TransactionalEmailAPI } from "../ports/transactionalEmailAPI";

export class StubTransactionalEmailAPI implements TransactionalEmailAPI {
  async sendWelcomeEmail(email: string): Promise<void> {
    console.log(`StubTransactionalEmailAPI: Sending welcome email to ${email}...`);
  }
}
