export interface TransactionalEmailAPI {
  sendMail(email: string): Promise<void>;
}
