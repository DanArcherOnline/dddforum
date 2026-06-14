import { AppNotifications } from '../components/appNotifications';
import { HeaderComponent } from '../components/headerComponent';
import { PuppeteerPageDriver } from '../driver';
import { Pages } from './pages';
import { RegistrationPage } from './registrationPage';

export interface App {
  pages: Pages;
  layout: {
    header: HeaderComponent;
  };
  notifications: AppNotifications;
}

export function createApplicationPageObject(pageDriver: PuppeteerPageDriver): App {
  return {
    pages: {
      registration: new RegistrationPage(pageDriver),
    },
    layout: {
      header: new HeaderComponent(pageDriver),
    },
    notifications: new AppNotifications(pageDriver),
  };
}
