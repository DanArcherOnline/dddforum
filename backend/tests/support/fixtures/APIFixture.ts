import { createUsersAPI } from "@dddforum/shared/src/api/users";
import { createMarketingAPI } from "@dddforum/shared/src/api/marketing";

const TEST_PORT = 3001;

export class APIFixture {
  readonly users: ReturnType<typeof createUsersAPI>;
  readonly marketing: ReturnType<typeof createMarketingAPI>;

  constructor() {
    const baseURL = `http://localhost:${TEST_PORT}`;
    this.users = createUsersAPI(baseURL);
    this.marketing = createMarketingAPI(baseURL);
  }
}
