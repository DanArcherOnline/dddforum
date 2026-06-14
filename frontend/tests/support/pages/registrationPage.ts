import { CreateUserInput } from '@dddforum/shared/src/api/users';
import { PuppeteerPageDriver } from '../driver';
import { PageObject } from './pageObject';

const FRONTEND_URL = 'http://localhost:5173';

export class RegistrationPage extends PageObject {
  constructor(driver: PuppeteerPageDriver) {
    super(driver, `${FRONTEND_URL}/join`);
  }

  async enterAccountDetails(input: CreateUserInput) {
    await this.driver.page.type('input[name="email"]', input.email);
    await this.driver.page.type('input[name="username"]', input.username);
    await this.driver.page.type('input[name="firstName"]', input.firstName);
    await this.driver.page.type('input[name="lastName"]', input.lastName);
  }

  async acceptMarketingEmails() {
    await this.driver.page.click('input[name="marketingEmails"]');
  }

  async submitRegistrationForm() {
    await this.driver.page.click('button[type="submit"]');
    await this.driver.page.waitForNavigation();
  }
}
