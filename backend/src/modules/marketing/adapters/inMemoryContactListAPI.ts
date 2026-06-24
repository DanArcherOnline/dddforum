import type { ContactListAPI } from "../ports/contactListAPI";

export class InMemoryContactListAPI implements ContactListAPI {
  private emails: Set<string> = new Set();

  async addEmailToList(email: string): Promise<boolean> {
    this.emails.add(email);
    return true;
  }

  getEmails(): Set<string> {
    return this.emails;
  }

  reset(): void {
    this.emails = new Set();
  }
}
