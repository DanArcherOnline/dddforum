import { createAPIClient } from "@dddforum/shared/src/api";
import { UserBuilder } from "@dddforum/shared/tests/support/builders/users";
import { CompositionRoot } from "../../src/shared/compositionRoot";
import { Config } from "../../src/shared/config";
import { Errors } from "../../src/shared/errors";

describe("users http API", () => {
  const apiClient = createAPIClient("http://localhost:3000");
  const config = new Config("test:infra");

  const composition = CompositionRoot.createCompositionRoot(config);
  const server = composition.getWebServer();

  const application = composition.getApplication();

  let createUserSpy: jest.SpyInstance;

  beforeAll(async () => {
    await server.start();
    createUserSpy = jest.spyOn(application.users, "createUser");
  });

  afterEach(() => {
    createUserSpy.mockClear();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("can create users", async () => {
    const createUserInput = new UserBuilder()
      .makeCreateUserInputBuilder()
      .withAllRandomDetails()
      .withFirstName("Khalil")
      .withLastName("Stemmler")
      .build();

    const createUserResponseStub = new UserBuilder()
      .makeCreateUserResponseBuilder()
      .withEmail(createUserInput.email)
      .withFirstName(createUserInput.firstName)
      .withLastName(createUserInput.lastName)
      .withUsername(createUserInput.username)
      .build();

    createUserSpy.mockResolvedValue(createUserResponseStub);

    // Act
    await apiClient.users.register(createUserInput);

    // Communication: Expect it to have called the correct use case
    expect(application.users.createUser).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when email is already in use", async () => {
    const createUserInput = new UserBuilder()
      .makeCreateUserInputBuilder()
      .withAllRandomDetails()
      .build();

    createUserSpy.mockResolvedValue({
      success: false,
      error: Errors.EmailAlreadyInUse,
      data: undefined,
    });

    const response = await apiClient.users.register(createUserInput);

    expect(application.users.createUser).toHaveBeenCalledTimes(1);
    expect(response.success).toBe(false);
    expect(response.error.code).toBeUndefined();
  });
});
