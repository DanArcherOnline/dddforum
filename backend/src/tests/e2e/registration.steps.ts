import path from "path";
import { loadFeature, defineFeature } from "jest-cucumber";
import request, { Response } from "supertest";
import { app } from "../../index";
import { prisma } from "../../database/prismaClient";
import { CreateUserInput } from "@dddforum/shared/src/api/users";
import { CreateUserInputBuilder } from "../builders/CreateUserInputBuilder";

const feature = loadFeature(
  path.join(__dirname, "../../../../shared/tests/features/registration.feature")
);

afterAll(async () => {
  await prisma.$disconnect();
});

defineFeature(feature, (test) => {
  let createUserResponse: Response;
  let addEmailToListResponse: Response;

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
        createUserResponse = await request(app)
          .post("/users/new")
          .send(createUserInput);

        addEmailToListResponse = await request(app)
          .post("/marketing/new")
          .send({ email: createUserInput.email });
      }
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
        createUserResponse = await request(app)
          .post("/users/new")
          .send(createUserInput);
      }
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
});
