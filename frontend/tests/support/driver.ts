import puppeteer, { Browser, Page, PuppeteerNodeLaunchOptions } from 'puppeteer';

export class PuppeteerPageDriver {
  constructor(public browser: Browser, public page: Page) {}

  static async create(options: PuppeteerNodeLaunchOptions): Promise<PuppeteerPageDriver> {
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    return new PuppeteerPageDriver(browser, page);
  }
}
