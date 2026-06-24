import type { ContactListAPI } from "./ports/contactListAPI";
import { ServerErrorException } from "../../shared/exceptions";

export class MarketingService {
  constructor(private contactListAPI: ContactListAPI) {}

  async addEmailToList(email: string): Promise<boolean> {
    try {
      return await this.contactListAPI.addEmailToList(email);
    } catch {
      throw new ServerErrorException();
    }
  }
}
