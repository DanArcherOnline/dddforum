export interface TransactionalEmailAPI {
  sendWelcomeEmail(email: string): Promise<void>;
}
