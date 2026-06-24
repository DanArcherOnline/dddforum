import { Spy } from "../../../shared/testDoubles/spy";
import type { ContactListAPI } from "../ports/contactListAPI";

export class ContactListAPISpy
  extends Spy<ContactListAPI>
  implements ContactListAPI
{
  private emails: Set<string> = new Set();

  constructor() {
    super();
  }

  async addEmailToList(email: string): Promise<boolean> {
    this.addCall("addEmailToList", [email]);
    this.emails.add(email);
    return true;
  }

  reset() {
    this.calls = [];
    this.emails = new Set();
  }
}
