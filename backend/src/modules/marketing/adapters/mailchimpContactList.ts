import type { ContactListAPI } from "../ports/contactListAPI";

export class MailchimpContactList implements ContactListAPI {
  async addEmailToList(email: string): Promise<boolean> {
    console.log(`MailchimpContactList: Adding ${email} to list... for production usage.`);
    return true;
  }
}
