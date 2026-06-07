import type { ContactListAPIStub } from "./contactListAPI";
import { ServerErrorException } from "../../shared/exceptions";

export class MarketingService {
  constructor(private contactListAPI: ContactListAPIStub) {}

  async addEmailToList(email: string): Promise<boolean> {
    try {
      return await this.contactListAPI.addEmailToList(email);
    } catch {
      throw new ServerErrorException();
    }
  }
}
