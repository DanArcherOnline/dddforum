import { appSelectors } from "@dddforum/frontend/src/shared/selectors";
import { PuppeteerPageDriver } from "../driver";
import { Component, PageElements } from "./component";

export class AppNotifications extends Component {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver);
    this.elements = new PageElements(
      {
        failure: { selector: appSelectors.notifications.failure, type: "div" },
        success: { selector: appSelectors.notifications.success, type: "div" },
      },
      driver,
    );
  }

  async getTextFromFailureNotification() {
    const el = await this.elements.get("failure");
    if (el instanceof Component) throw new Error("Expected ElementHandle");
    return el.evaluate((e: Element) => e.textContent);
  }

  async getTextFromSuccessNotification() {
    const el = await this.elements.get("success");
    if (el instanceof Component) throw new Error("Expected ElementHandle");
    return el.evaluate((e: Element) => e.textContent);
  }
}
