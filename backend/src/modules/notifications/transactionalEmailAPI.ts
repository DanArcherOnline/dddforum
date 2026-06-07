export class TransactionalEmailAPI {
  async sendWelcomeEmail(email: string): Promise<void> {
    console.log(`TransactionalEmailAPI: Sending welcome email to ${email}...`);
  }
}
