import path from "path";
import { loadFeature, defineFeature } from "jest-cucumber";
import { Config } from "../../src/shared/config";
import { CompositionRoot } from "../../src/shared/compositionRoot";
import { InMemoryUserRepositorySpy } from "../../src/modules/users/adapters/inMemoryUserRepositorySpy";
import { TransactionalEmailAPISpy } from "../../src/modules/notifications/adapters/transactionalEmailAPISpy";
import { ContactListAPISpy } from "../../src/modules/marketing/adapters/contactListAPISpy";
import { CreateUserBuilder } from "@dddforum/shared/tests/support/builders/createUserBuilder";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";
import type { CreateUserParams } from "@dddforum/shared/src/api/users";
import { CreateUserDTO } from "../../src/modules/users/CreateUserDTO";
import {
  EmailAlreadyInUseException,
  InvalidRequestBodyException,
  UsernameAlreadyTakenException,
} from "../../src/shared/exceptions";
import type { PublicUser } from "../../src/modules/users/userView";

const sharedTestRoot = path.join(__dirname, "../../../shared/tests");

const feature = loadFeature(
  path.join(sharedTestRoot, "features/registration.feature"),
);

defineFeature(feature, (test) => {
  let composition: CompositionRoot;
  let application: ReturnType<CompositionRoot["getApplication"]>;
  let userRepoSpy: InMemoryUserRepositorySpy;
  let transactionalEmailAPISpy: TransactionalEmailAPISpy;
  let contactListAPISpy: ContactListAPISpy;

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(
      new Config("test:unit"),
    );
    application = composition.getApplication();
    userRepoSpy = composition.getRepositories()
      .users as InMemoryUserRepositorySpy;
    transactionalEmailAPISpy = composition.getRepositories()
      .transactionalEmail as TransactionalEmailAPISpy;
    contactListAPISpy = composition.getRepositories()
      .contactList as ContactListAPISpy;
  });

  afterEach(async () => {
    await userRepoSpy.reset();
    contactListAPISpy.reset();
    transactionalEmailAPISpy.reset();
  });

  test("Successful registration with marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    let createUserInput: CreateUserParams;
    let createUserResponse: PublicUser;
    let addEmailToListResponse: boolean;

    given("I am a new user", () => {
      createUserInput = new CreateUserBuilder().withAllRandomDetails().build();
    });

    when(
      "I register with valid account details accepting marketing emails",
      async () => {
        createUserResponse =
          await application.users.createUser(createUserInput);
        addEmailToListResponse = await application.marketing.addEmailToList(
          createUserInput.email,
        );
      },
    );

    then("I should be granted access to my account", async () => {
      // Result verification
      expect(createUserResponse.id).toBeDefined();
      expect(createUserResponse.email).toEqual(createUserInput.email);
      expect(createUserResponse.firstName).toEqual(createUserInput.firstName);
      expect(createUserResponse.lastName).toEqual(createUserInput.lastName);
      expect(createUserResponse.username).toEqual(createUserInput.username);

      // State verification
      const getUserResponse = await application.users.getUserByEmail(
        createUserInput.email,
      );
      expect(createUserInput.email).toEqual(getUserResponse.email);

      // Communication verification
      expect(userRepoSpy.getTimesMethodCalled("save")).toEqual(1);
      expect(transactionalEmailAPISpy.getTimesMethodCalled("sendMail")).toEqual(
        1,
      );
    });

    and("I should expect to receive marketing emails", () => {
      // Result verification
      expect(addEmailToListResponse).toBe(true);
      // Communication verification
      expect(contactListAPISpy.getTimesMethodCalled("addEmailToList")).toEqual(
        1,
      );
    });
  });

  test("Successful registration without marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    let createUserInput: CreateUserParams;
    let createUserResponse: PublicUser;

    given("I am a new user", () => {
      createUserInput = new CreateUserBuilder().withAllRandomDetails().build();
    });

    when(
      "I register with valid account details declining marketing emails",
      async () => {
        createUserResponse =
          await application.users.createUser(createUserInput);
      },
    );

    then("I should be granted access to my account", async () => {
      // Result verification
      expect(createUserResponse.id).toBeDefined();
      expect(createUserResponse.email).toEqual(createUserInput.email);
      expect(createUserResponse.firstName).toEqual(createUserInput.firstName);
      expect(createUserResponse.lastName).toEqual(createUserInput.lastName);
      expect(createUserResponse.username).toEqual(createUserInput.username);

      // State verification
      const getUserResponse = await application.users.getUserByEmail(
        createUserInput.email,
      );
      expect(createUserInput.email).toEqual(getUserResponse.email);

      // Communication verification
      expect(userRepoSpy.getTimesMethodCalled("save")).toEqual(1);
      expect(transactionalEmailAPISpy.getTimesMethodCalled("sendMail")).toEqual(
        1,
      );
    });

    and("I should not expect to receive marketing emails", () => {
      // Communication verification: addEmailToList was NOT called
      expect(contactListAPISpy.getTimesMethodCalled("addEmailToList")).toEqual(
        0,
      );
    });
  });

  test("Invalid or missing registration details", ({
    given,
    when,
    then,
    and,
  }) => {
    let invalidInput: unknown;
    let thrownError: unknown;

    given("I am a new user", () => {
      invalidInput = { firstName: "John" };
    });

    when("I register with invalid account details", () => {
      try {
        CreateUserDTO.fromRequest(invalidInput);
      } catch (err) {
        thrownError = err;
      }
    });

    then("I should see an error notifying me that my input is invalid", () => {
      // Result verification
      expect(thrownError).toBeInstanceOf(InvalidRequestBodyException);
    });

    and("I should not have been sent access to account details", async () => {
      // Communication verification: save was NOT called
      expect(userRepoSpy.getTimesMethodCalled("save")).toEqual(0);
    });
  });

  test("Account already created with email", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserParams[];
    let errors: unknown[];

    given("a set of users already created accounts", async (table) => {
      type Row = { firstName: string; lastName: string; email: string };
      existingUserInputs = table.map((row: Row) =>
        new CreateUserBuilder()
          .withFirstName(row.firstName)
          .withLastName(row.lastName)
          .withEmail(row.email)
          .withUsername(TextUtil.createRandomText(10))
          .build(),
      );
      await Promise.all(
        existingUserInputs.map((input) => application.users.createUser(input)),
      );
    });

    when("new users attempt to register with those emails", async () => {
      errors = await Promise.all(
        existingUserInputs.map((existing) =>
          application.users
            .createUser(
              new CreateUserBuilder()
                .withFirstName(TextUtil.createRandomText(10))
                .withLastName(TextUtil.createRandomText(10))
                .withEmail(existing.email)
                .withUsername(TextUtil.createRandomText(10))
                .build(),
            )
            .catch((err) => err),
        ),
      );
    });

    then(
      "they should see an error notifying them that the account already exists",
      () => {
        // Result verification
        for (const err of errors) {
          expect(err).toBeInstanceOf(EmailAlreadyInUseException);
        }
      },
    );

    and(
      "they should not have been sent access to account details",
      async () => {
        // State verification: each original email exists exactly once (no duplicates saved)
        for (const input of existingUserInputs) {
          const user = await application.users.getUserByEmail(input.email);
          expect(user).not.toBeNull();
        }
      },
    );
  });

  test("Username already taken", ({ given, when, then, and }) => {
    let existingUserInputs: CreateUserParams[];
    let errors: unknown[];

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
          new CreateUserBuilder()
            .withFirstName(row.firstName)
            .withLastName(row.lastName)
            .withEmail(row.email)
            .withUsername(row.username)
            .build(),
        );
        await Promise.all(
          existingUserInputs.map((input) =>
            application.users.createUser(input),
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
        const newUserInputs: CreateUserParams[] = table.map((row: Row) =>
          new CreateUserBuilder()
            .withFirstName(row.firstName)
            .withLastName(row.lastName)
            .withEmail(row.email)
            .withUsername(row.username)
            .build(),
        );
        errors = await Promise.all(
          newUserInputs.map((input) =>
            application.users.createUser(input).catch((err) => err),
          ),
        );
      },
    );

    then(
      "they see an error notifying them that the username has already been taken",
      () => {
        // Result verification
        for (const err of errors) {
          expect(err).toBeInstanceOf(UsernameAlreadyTakenException);
        }
      },
    );

    and(
      "they should not have been sent access to account details",
      async () => {
        // Communication verification: save was NOT called for the new users with taken usernames
        expect(userRepoSpy.getTimesMethodCalled("save")).toEqual(
          existingUserInputs.length,
        );
      },
    );
  });
});
