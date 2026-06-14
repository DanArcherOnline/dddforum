import { defineFeature, loadFeature } from "jest-cucumber";
import { sharedTestRoot } from "@dddforum/shared/src/paths";
import { CreateUserInputBuilder } from "@dddforum/shared/tests/support/builders/createUserBuilder";
import { CreateUserInput } from "@dddforum/shared/src/api/users";
import { Pages } from "../support/pages/pages";
import * as path from "path";
import { PuppeteerPageDriver } from "../support/driver";
import { App, createApplicationPageObject } from "../support/pages";
import { DatabaseFixture } from "@dddforum/shared/tests/support/fixtures/databaseFixture";

const feature = loadFeature(
  path.join(sharedTestRoot, "features/registration.feature"),
  { tagFilter: "@frontend" },
);

defineFeature(feature, (test) => {
  let app: App;
  let pages: Pages;
  let puppeteerPageDriver: PuppeteerPageDriver;
  let userInput: CreateUserInput;
  let databaseFixture: DatabaseFixture;

  beforeAll(async () => {
    databaseFixture = new DatabaseFixture();
    puppeteerPageDriver = await PuppeteerPageDriver.create({
      headless: false,
      slowMo: 50,
    });
    app = createApplicationPageObject(puppeteerPageDriver);
    pages = app.pages;
  });

  afterAll(async () => {
    await puppeteerPageDriver.browser.close();
  });

  afterEach(async () => {
    await databaseFixture.resetDatabase();
  });

  jest.setTimeout(60000);

  test("Successful registration with marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    given("I am a new user", async () => {
      userInput = new CreateUserInputBuilder().withAllRandomDetails().build();

      await pages.registration.open();
    });

    when(
      "I register with valid account details accepting marketing emails",
      async () => {
        await pages.registration.enterAccountDetails(userInput);
        await pages.registration.acceptMarketingEmails();
        await pages.registration.submitRegistrationForm();
      },
    );

    then("I should be granted access to my account", async () => {
      expect(await app.layout.header.getLoggedInUserName()).toContain(
        userInput.username,
      );
    });

    and("I should expect to receive marketing emails", () => {
      // @See backend
    });
  });

  test("Invalid or missing registration details", ({
    given,
    when,
    then,
    and,
  }) => {
    given("I am a new user", () => {});
    when("I register with invalid account details", () => {});
    then(
      "I should see an error notifying me that my input is invalid",
      () => {},
    );
    and("I should not have been sent access to account details", () => {});
  });

  test("Account already created with email", ({ given, when, then, and }) => {
    given("a set of users already created accounts", () => {});
    when("new users attempt to register with those emails", () => {});
    then(
      "they should see an error notifying them that the account already exists",
      () => {},
    );
    and("they should not have been sent access to account details", () => {});
  });
});
