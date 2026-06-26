import { ProductionUserRepository } from "../../src/modules/users/adapters/productionUserRepository";
import { InMemoryUserRepositorySpy } from "../../src/modules/users/adapters/inMemoryUserRepositorySpy";
import { UserBuilder } from "@dddforum/shared/tests/support/builders/users";
import { prisma } from "../../src/shared/database/prismaClient";
import type { UsersRepository } from "../../src/modules/users/ports/usersRepository";
import { DatabaseFixture } from "../support/fixtures/DatabaseFixture";

describe("userRepo", () => {
  const databaseFixture = new DatabaseFixture();
  let userRepos: UsersRepository[];

  beforeEach(() => {
    userRepos = [
      new ProductionUserRepository(prisma),
      new InMemoryUserRepositorySpy(),
    ];
  });

  afterEach(async () => {
    await databaseFixture.resetDatabase();
  });

  it("can save and retrieve users by email", async () => {
    const createUserInput = new UserBuilder()
      .makeValidatedUserBuilder()
      .withAllRandomDetails()
      .build();

    for (const userRepo of userRepos) {
      const savedUser = await userRepo.save({ ...createUserInput, password: "testpassword" });
      const fetchedUser = await userRepo.findUserByEmail(createUserInput.email);

      expect(savedUser).toBeDefined();
      expect(fetchedUser).toBeDefined();
      expect(savedUser.email).toEqual(fetchedUser?.email);
    }
  });

  it("can find a user by username", async () => {
    const createUserInput = new UserBuilder()
      .makeValidatedUserBuilder()
      .withAllRandomDetails()
      .build();

    for (const userRepo of userRepos) {
      const savedUser = await userRepo.save({ ...createUserInput, password: "testpassword" });
      const fetchedUser = await userRepo.findUserByUsername(
        createUserInput.username,
      );

      expect(savedUser).toBeDefined();
      expect(fetchedUser).toBeDefined();
      expect(savedUser.username).toEqual(fetchedUser?.username);
    }
  });

  it("returns null when user is not found by email", async () => {
    for (const userRepo of userRepos) {
      const fetchedUser = await userRepo.findUserByEmail("nonexistent@example.com");
      expect(fetchedUser).toBeNull();
    }
  });

  it("returns null when user is not found by username", async () => {
    for (const userRepo of userRepos) {
      const fetchedUser = await userRepo.findUserByUsername("nonexistentuser");
      expect(fetchedUser).toBeNull();
    }
  });
});
