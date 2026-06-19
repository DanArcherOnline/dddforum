import { defineFeature, loadFeature } from "jest-cucumber";
import { sharedTestRoot } from "@dddforum/shared/src/paths";
import { CreateUserBuilder } from "@dddforum/shared/tests/support/builders/createUserBuilder";
import { CreateUserInput } from "@dddforum/shared/src/api/users";
import { Pages } from "../support/pages/pages";
import * as path from "path";
import { PuppeteerPageDriver } from "../support/driver";
import { App, createAppObject } from "../support/pages";
import { DatabaseFixture } from "@dddforum/shared/tests/support/fixtures/databaseFixture";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";

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
    app = createAppObject(puppeteerPageDriver);
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
      userInput = new CreateUserBuilder().withAllRandomDetails().build();

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
      expect(await app.layout.header.getUsernameFromHeader()).toContain(
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
    given("I am a new user", async () => {
      userInput = new CreateUserBuilder().withAllRandomDetails().build();

      await pages.registration.open();
    });
    when("I register with invalid account details", async () => {
      await pages.registration.enterAccountDetails({
        ...userInput,
        email: "invalid-email-format",
      });
      await pages.registration.submitRegistrationForm();
    });
    then(
      "I should see an error notifying me that my input is invalid",
      async () => {
        const notification =
          await app.notifications.getTextFromFailureNotification();
        expect(notification).toBeTruthy();
      },
    );
    and("I should not have been sent access to account details", async () => {
      expect(await app.layout.header.isUsernamePresent()).toBe(false);
    });
  });

  test("Account already created with email", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserInput[];
    let notificationResults: (string | null)[];
    let accessResults: boolean[];

    given("a set of users already created accounts", async (table) => {
      type Row = { firstName: string; lastName: string; email: string };
      existingUserInputs = table.map((row: Row) =>
        new CreateUserBuilder()
          .withFirstName(row.firstName)
          .withLastName(row.lastName)
          .withUsername(TextUtil.createRandomText(10))
          .withEmail(row.email)
          .build(),
      );
      await databaseFixture.setupExistingUsers(existingUserInputs);
    });

    when("new users attempt to register with those emails", async () => {
      notificationResults = [];
      accessResults = [];

      for (const existing of existingUserInputs) {
        await pages.registration.open();
        const newUser = new CreateUserBuilder()
          .withAllRandomDetails()
          .withEmail(existing.email)
          .build();
        await pages.registration.enterAccountDetails(newUser);
        await pages.registration.submitRegistrationForm();

        notificationResults.push(
          await app.notifications.getTextFromFailureNotification(),
        );
        accessResults.push(await app.layout.header.isUsernamePresent());
      }
    });

    then(
      "they should see an error notifying them that the account already exists",
      async () => {
        for (const notification of notificationResults) {
          expect(notification).toContain("email is already in use");
        }
      },
    );

    and(
      "they should not have been sent access to account details",
      async () => {
        for (const isUsernamePresent of accessResults) {
          expect(isUsernamePresent).toBe(false);
        }
      },
    );
  });
});
