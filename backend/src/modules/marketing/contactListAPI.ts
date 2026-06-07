export class ContactListAPIStub {
  async addEmailToList(email: string): Promise<boolean> {
    console.log(`Adding ${email} to marketing list...`);
    return true;
  }
}
