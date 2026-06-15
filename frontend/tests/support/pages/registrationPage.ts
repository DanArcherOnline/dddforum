import { PuppeteerPageDriver } from '../driver';
import { PageObject } from './pageObject';
import { PageElements, PageElementsConfig } from '../components/component';
import { CreateUserParams } from '@dddforum/shared/src/api/users';

export class RegistrationPage extends PageObject {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver, 'http://localhost:5173/join');
    this.elements = new PageElements({
      email: { selector: '.registration.email', type: 'input' },
      username: { selector: '.registration.username', type: 'input' },
      firstname: { selector: '.registration.first-name', type: 'input' },
      lastname: { selector: '.registration.last-name', type: 'input' },
      marketingCheckbox: {
        selector: '.registration.marketing-emails',
        type: 'checkbox',
      },
      submit: { selector: '.registration.submit-button', type: 'button' },
    } as PageElementsConfig, driver);
  }

  async enterAccountDetails(params: CreateUserParams) {
    await this.elements.get('email').then((e: any) => e.type(params.email));
    await this.elements.get('username').then((e: any) => e.type(params.username));
    await this.elements.get('firstname').then((e: any) => e.type(params.firstName));
    await this.elements.get('lastname').then((e: any) => e.type(params.lastName));
  }

  async acceptMarketingEmails() {
    await this.elements.get('marketingCheckbox').then((e: any) => e.click());
  }

  async submitRegistrationForm() {
    await this.elements.get('submit').then((e: any) => e.click());
  }
}
