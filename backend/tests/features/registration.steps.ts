import path from "path";
import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/shared/database/prismaClient";
import { Config } from "../../src/shared/config";
import { CompositionRoot } from "../../src/shared/compositionRoot";
import { CreateUserInput, CreateUserResponse } from "@dddforum/shared/src/api/users";
import { AddEmailToListResponse } from "@dddforum/shared/src/api/marketing";
import { APIFixture } from "../support/fixtures/APIFixture";
import { CreateUserInputBuilder } from "../support/builders/CreateUserInputBuilder";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";
import { DatabaseFixture } from "../support/fixtures/DatabaseFixture";

const feature = loadFeature(
  path.join(
    __dirname,
    "../../../shared/tests/features/registration.feature",
  ),
);

const databaseFixture = new DatabaseFixture();
const apiClient = new APIFixture();

defineFeature(feature, (test) => {
  let composition: CompositionRoot;
  const config = new Config("test:e2e");
  let response: CreateUserResponse;
  let addEmailToListResponse: AddEmailToListResponse;

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(config);
    await composition.getWebServer().start();
  });

  afterAll(async () => {
    await composition.getWebServer().stop();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await databaseFixture.resetDatabase();
  });

  test("Successful registration with marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    let createUserInput: CreateUserInput;

    given("I am a new user", async () => {
      createUserInput = new CreateUserInputBuilder()
        .withAllRandomDetails()
        .build();
    });

    when(
      "I register with valid account details accepting marketing emails",
      async () => {
        response = await apiClient.users.register(createUserInput);
        addEmailToListResponse = await apiClient.marketing.addEmailToList(createUserInput.email);
      },
    );

    then("I should be granted access to my account", async () => {
      const { data, success, error } = response;

      expect(success).toBeTruthy();
      expect(error).toEqual({});
      expect(data!.id).toBeDefined();
      expect(data!.email).toEqual(createUserInput.email);
      expect(data!.firstName).toEqual(createUserInput.firstName);
      expect(data!.lastName).toEqual(createUserInput.lastName);
      expect(data!.username).toEqual(createUserInput.username);

      // And the user exists (State Verification)
      const getUserResponse = await apiClient.users.getUserByEmail(createUserInput.email);
      const { data: getUserData } = getUserResponse;
      expect(createUserInput.email).toEqual(getUserData!.email);
    });

    and("I should expect to receive marketing emails", () => {
      const { success } = addEmailToListResponse;
      expect(success).toBeTruthy();
    });
  });

  test("Successful registration without marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    let createUserInput: CreateUserInput;
    let marketingEmailAdded = false;

    given("I am a new user", async () => {
      createUserInput = new CreateUserInputBuilder()
        .withAllRandomDetails()
        .build();
    });

    when(
      "I register with valid account details declining marketing emails",
      async () => {
        response = await apiClient.users.register(createUserInput);
      },
    );

    then("I should be granted access to my account", async () => {
      const { data, success, error } = response;

      expect(success).toBeTruthy();
      expect(error).toEqual({});
      expect(data!.id).toBeDefined();
      expect(data!.email).toEqual(createUserInput.email);
      expect(data!.firstName).toEqual(createUserInput.firstName);
      expect(data!.lastName).toEqual(createUserInput.lastName);
      expect(data!.username).toEqual(createUserInput.username);
    });

    and("I should not expect to receive marketing emails", () => {
      expect(marketingEmailAdded).toBe(false);
    });
  });

  test("Invalid or missing registration details", ({
    given,
    when,
    then,
    and,
  }) => {
    let invalidUserInput: Partial<CreateUserInput>;

    given("I am a new user", () => {
      invalidUserInput = { firstName: "John" };
    });

    when("I register with invalid account details", async () => {
      response = await apiClient.users.register(invalidUserInput as CreateUserInput);
    });

    then("I should see an error notifying me that my input is invalid", () => {
      const { success, error } = response;
      expect(success).toBeFalsy();
      expect(error).toBeDefined();
    });

    and("I should not have been sent access to account details", () => {
      const { data } = response;
      expect(data).toBeUndefined();
    });
  });

  test("Account already created with email", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserInput[];
    let responses: CreateUserResponse[];

    given("a set of users already created accounts", async (table) => {
      type Row = { firstName: string; lastName: string; email: string };
      existingUserInputs = table.map((row: Row) =>
        new CreateUserInputBuilder()
          .withFirstName(row.firstName)
          .withLastName(row.lastName)
          .withEmail(row.email)
          .withUsername(TextUtil.createRandomText(10))
          .build(),
      );
      await Promise.all(
        existingUserInputs.map((input) => apiClient.users.register(input)),
      );
    });

    when("new users attempt to register with those emails", async () => {
      responses = await Promise.all(
        existingUserInputs.map((existing) =>
          apiClient.users.register(
            new CreateUserInputBuilder()
              .withFirstName(TextUtil.createRandomText(10))
              .withLastName(TextUtil.createRandomText(10))
              .withEmail(existing.email)
              .withUsername(TextUtil.createRandomText(10))
              .build(),
          ),
        ),
      );
    });

    then(
      "they should see an error notifying them that the account already exists",
      () => {
        for (const r of responses) {
          expect(r.success).toBeFalsy();
          expect(r.error).toBeDefined();
        }
      },
    );

    and("they should not have been sent access to account details", () => {
      for (const r of responses) {
        expect(r.data).toBeUndefined();
      }
    });
  });

  test("Username already taken", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserInput[];
    let responses: CreateUserResponse[];

    given(
      "a set of users have already created their accounts with valid details",
      async (table) => {
        type Row = {
          firstName: string;
          lastName: string;
          username: string;
          email: string;
        };
        existingUserInputs = table.map((row: Row) =>
          new CreateUserInputBuilder()
            .withFirstName(row.firstName)
            .withLastName(row.lastName)
            .withEmail(row.email)
            .withUsername(row.username)
            .build(),
        );
        await Promise.all(
          existingUserInputs.map((input) => apiClient.users.register(input)),
        );
      },
    );

    when(
      "new users attempt to register with already taken usernames",
      async (table) => {
        type Row = {
          firstName: string;
          lastName: string;
          username: string;
          email: string;
        };
        const newUserInputs: CreateUserInput[] = table.map((row: Row) =>
          new CreateUserInputBuilder()
            .withFirstName(row.firstName)
            .withLastName(row.lastName)
            .withEmail(row.email)
            .withUsername(row.username)
            .build(),
        );
        responses = await Promise.all(
          newUserInputs.map((input) => apiClient.users.register(input)),
        );
      },
    );

    then(
      "they see an error notifying them that the username has already been taken",
      () => {
        for (const r of responses) {
          expect(r.success).toBeFalsy();
          expect(r.error).toBeDefined();
        }
      },
    );

    and("they should not have been sent access to account details", () => {
      for (const r of responses) {
        expect(r.data).toBeUndefined();
      }
    });
  });
});
