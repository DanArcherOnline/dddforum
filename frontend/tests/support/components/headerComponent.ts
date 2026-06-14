import { PuppeteerPageDriver } from '../driver';

export class HeaderComponent {
  constructor(private driver: PuppeteerPageDriver) {}

  async getLoggedInUserName(): Promise<string> {
    await this.driver.page.waitForSelector('#header-action-button div div');
    return this.driver.page.$eval('#header-action-button div div', (el) => el.textContent ?? '');
  }
}
