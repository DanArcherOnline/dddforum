import path from "path";
import { loadFeature, defineFeature } from "jest-cucumber";

const sharedTestRoot = path.join(__dirname, "../../../shared/tests");

const feature = loadFeature(
  path.join(sharedTestRoot, "features/registration.feature"),
  {
    tagFilter: "@frontend",
  },
);

defineFeature(feature, (test) => {
  test("Successful registration with marketing emails accepted", ({
    given,
    when,
    then,
    and,
  }) => {
    given("I am a new user", () => {});
    when("I register with valid account details accepting marketing emails", () => {});
    then("I should be granted access to my account", () => {});
    and("I should expect to receive marketing emails", () => {});
  });

  test("Invalid or missing registration details", ({
    given,
    when,
    then,
    and,
  }) => {
    given("I am a new user", () => {});
    when("I register with invalid account details", () => {});
    then("I should see an error notifying me that my input is invalid", () => {});
    and("I should not have been sent access to account details", () => {});
  });

  test("Account already created with email", ({
    given,
    when,
    then,
    and,
  }) => {
    given("a set of users already created accounts", () => {});
    when("new users attempt to register with those emails", () => {});
    then("they should see an error notifying them that the account already exists", () => {});
    and("they should not have been sent access to account details", () => {});
  });
});
