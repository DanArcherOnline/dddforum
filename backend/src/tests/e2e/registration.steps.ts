import path from "path";
import { loadFeature, defineFeature } from "jest-cucumber";
import request, { Response } from "supertest";
import { prisma } from "../../database/prismaClient";
import { Config } from "../../shared/config";
import { CompositionRoot } from "../../compositionRoot";
import { CreateUserInput } from "@dddforum/shared/src/api/users";
import { CreateUserInputBuilder } from "../builders/CreateUserInputBuilder";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";
import { DatabaseFixture } from "../fixtures/DatabaseFixture";

const feature = loadFeature(
  path.join(
    __dirname,
    "../../../../shared/tests/features/registration.feature",
  ),
);

const databaseFixture = new DatabaseFixture();

defineFeature(feature, (test) => {
  let composition: CompositionRoot;
  const config = new Config("test:e2e");
  let createUserResponse: Response;
  let addEmailToListResponse: Response;

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(config);
  });

  afterAll(async () => {
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
        createUserResponse = await request(composition.getWebServer().getApplication())
          .post("/users/new")
          .send(createUserInput);

        addEmailToListResponse = await request(composition.getWebServer().getApplication())
          .post("/marketing/new")
          .send({ email: createUserInput.email });
      },
    );

    then("I should be granted access to my account", async () => {
      const { data, success, error } = createUserResponse.body;

      expect(success).toBeTruthy();
      expect(error).toEqual({});
      expect(data!.id).toBeDefined();
      expect(data!.email).toEqual(createUserInput.email);
      expect(data!.firstName).toEqual(createUserInput.firstName);
      expect(data!.lastName).toEqual(createUserInput.lastName);
      expect(data!.username).toEqual(createUserInput.username);
    });

    and("I should expect to receive marketing emails", () => {
      const { success } = addEmailToListResponse.body;
      expect(createUserResponse.status).toBe(201);
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
        createUserResponse = await request(composition.getWebServer().getApplication())
          .post("/users/new")
          .send(createUserInput);
      },
    );

    then("I should be granted access to my account", async () => {
      const { data, success, error } = createUserResponse.body;

      expect(success).toBeTruthy();
      expect(error).toEqual({});
      expect(data!.id).toBeDefined();
      expect(data!.email).toEqual(createUserInput.email);
      expect(data!.firstName).toEqual(createUserInput.firstName);
      expect(data!.lastName).toEqual(createUserInput.lastName);
      expect(data!.username).toEqual(createUserInput.username);
    });

    and("I should not expect to receive marketing emails", () => {
      expect(createUserResponse.status).toBe(201);
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
      createUserResponse = await request(composition.getWebServer().getApplication())
        .post("/users/new")
        .send(invalidUserInput);
    });

    then("I should see an error notifying me that my input is invalid", () => {
      const { success, error } = createUserResponse.body;
      expect(createUserResponse.status).toBe(400);
      expect(success).toBeFalsy();
      expect(error).toBeDefined();
    });

    and("I should not have been sent access to account details", () => {
      const { data } = createUserResponse.body;
      expect(data).toBeUndefined();
    });
  });

  test("Account already created with email", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserInput[];
    let createUserResponses: Response[];

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
        existingUserInputs.map((input) =>
          request(composition.getWebServer().getApplication()).post("/users/new").send(input),
        ),
      );
    });

    when("new users attempt to register with those emails", async () => {
      createUserResponses = await Promise.all(
        existingUserInputs.map((existing) =>
          request(composition.getWebServer().getApplication())
            .post("/users/new")
            .send(
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
        for (const response of createUserResponses) {
          expect(response.status).toBe(409);
          expect(response.body.success).toBeFalsy();
          expect(response.body.error).toBeDefined();
        }
      },
    );

    and("they should not have been sent access to account details", () => {
      for (const response of createUserResponses) {
        expect(response.body.data).toBeUndefined();
      }
    });
  });

  test("Username already taken", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserInput[];
    let createUserResponses: Response[];

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
          existingUserInputs.map((input) =>
            request(composition.getWebServer().getApplication()).post("/users/new").send(input),
          ),
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
        createUserResponses = await Promise.all(
          newUserInputs.map((input) =>
            request(composition.getWebServer().getApplication()).post("/users/new").send(input),
          ),
        );
      },
    );

    then(
      "they see an error notifying them that the username has already been taken",
      () => {
        for (const response of createUserResponses) {
          expect(response.status).toBe(409);
          expect(response.body.success).toBeFalsy();
          expect(response.body.error).toBeDefined();
        }
      },
    );

    and("they should not have been sent access to account details", () => {
      for (const response of createUserResponses) {
        expect(response.body.data).toBeUndefined();
      }
    });
  });
});
