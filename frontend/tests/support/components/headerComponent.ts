import { PuppeteerPageDriver } from '../driver';
import { Component, PageElements } from './component';

export class HeaderComponent extends Component {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver);
    this.elements = new PageElements({
      header: { selector: '.header.username', type: 'div' },
    }, driver);
  }

  async getUsernameFromHeader() {
    const usernameElement = await this.elements.get('header');
    if (usernameElement instanceof Component) {
      throw new Error('Expected an ElementHandle, got a Component');
    }
    return usernameElement?.evaluate((e: any) => e.textContent);
  }
}
