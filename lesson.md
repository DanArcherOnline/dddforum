How to Stabilize the UI w/ Selectors #horizontalDecoupling
Last updated: September 7th, 2024

Topics: selectors (constant contracts), contracts, program by wishful thinking, the stable component principle

Major Topics: Design Principles, Architectural Principles

Finally, by this point, you should have all of the tests working.

The last thing we’ll do here is refactor to increase test stability drastically. How? With selectors (or constant contracts).

Lesson Goals
In this lesson, you’ll learn:

why using hard-coded selectors is an issue
about unstable and stable components
how & why we can use selectors to stabilize your UI
What’s the problem with hard-coded selectors?
Previously, you saw the way we used the selectors both in the react component like so:


...
  return (
    <div>
      <input
        className="registration email"
        type="email"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      ></input>
      <input
        className="registration username"
        type="text"
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      ></input>
      <input
        className="registration first-name"
        type="text"
        placeholder="first name"
        onChange={(e) => setFirstName(e.target.value)}
      ></input>
      <input
        className="registration last-name"
        type="text"
        placeholder="last name"
        onChange={(e) => setLastName(e.target.value)}
      ></input>
      <br/>
      <br/>
      <div>
        <button
          onClick={() => handleSubmit()}
          className="registration submit-button"
          type="submit"
        >
          Submit
        </button>
        <label>
          <input
            className="registration marketing-emails"
            type="checkbox"
            checked={allowMarketingEmails}
            onChange={() => toggleAllowMarketingEmails()}
          />
          Want to be notified about events & discounts?
        </label>
      </div>
      <br />
      <div className="to-login">
        <div>Already have an account?</div>
        <Link to="/login">Login</Link>
      </div>
    </div>
  );
};
And in our Page Objects as well

import { PuppeteerPageDriver } from "../driver";
import { PageObject } from "./pageObject";
import { PageElements, PageElementsConfig } from "../components";
import { CreateUserParams } from "@dddforum/shared/src/api/users";
import { appSelectors } from "@dddforum/frontend/src/shared/selectors";

export class RegistrationPage extends PageObject {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver, "<http://localhost:5173/join>");
    this.elements = new PageElements({
      email: { selector: ".registration.email", type: "input" },
      username: { selector: ".registration.username", type: "input" },
      firstname: { selector: ".registration.first-name", type: "input" },
      lastname: { selector: ".registration.last-name", type: "input" },
      marketingCheckbox: {
        selector: ".registration.marketing-emails",
        type: "checkbox",
      },
      submit: { selector: ".registration.submit-button", type: "button" },
    }, driver);
  }

  async enterAccountDetails(params: CreateUserParams) {
    await this.elements.get("email").then((e: any) => e.type(params.email));
    await this.elements.get("username").then((e: any) => e.type(params.username));
    await this.elements.get("firstname").then((e: any) => e.type(params.firstName));
    await this.elements.get("lastname").then((e: any) => e.type(params.lastName));
  }

  async acceptMarketingEmails() {
    await this.elements.get("marketingCheckbox").then((e: any) => e.click());

  }

  async submitRegistrationForm() {
    await this.elements.get("submit").then((e: any) => e.click());
  }
}

What’s the problem with this?

Well, what happens if we were to change the name of a selector? What happens then?

Or what if we change the structure of the UI? What then?

You’ll break your tests, of course.

The reason is because we haven’t stabilized the selector contract as a stable component. 

The Stable Component Principle
Robert Martin (Uncle Bob) writes about the idea of a Stable Component Principle. He says:

A component should be either stable or unstable. But if it’s stable, it should be hard to change. Meaning — well protected, and rarely modified.

That’s a great definition.

In essence:

Stable components should not change often, and they often have many incoming dependencies (other components relying on them). These components serve as the building blocks that other components depend on.
Unstable components can change more easily and often have fewer dependencies or are the ones relying on stable components.
Stable component examples
Here are a few stable components for example.

document.querySelector()
When’s the last time you saw this change?

Maybe never. That’s good, nearly every frontend library that operates against the DOM relies on this.

Here’s another one.

import { createUsersAPI } from "./users";
import { createMarketingAPI } from "./marketing";
import { createPostsAPI } from "./posts";

export type Error<U> = {
  message?: string;
  code?: U;
};

export type APIResponse<T, U> = {
  success: boolean;
  data: T;
  error: Error<U>;
};

export type ValidationError = "ValidationError";
export type ServerError = "ServerError";
export type GenericErrors = ValidationError | ServerError;

export const createAPIClient = (apiURL: string) => {
  return {
    users: createUsersAPI(apiURL),
    marketing: createMarketingAPI(apiURL),
    posts: createPostsAPI(apiURL),
  };
};

Remember this? It’s your API contract.

It should be unlikely that this layer of the API changes a lot, because if it were to change, then the frontend, desktop, and the backend services that implement it would be in for a lot of ripple as well.

Question: Is this a stable component?
Is it?

...
  return (
    <div>
      <input
        className="registration email"
        type="email"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      ></input>
      <input
        className="registration username"
        type="text"
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      ></input>
      <input
        className="registration first-name"
        type="text"
        placeholder="first name"
        onChange={(e) => setFirstName(e.target.value)}
      ></input>
      <input
        className="registration last-name"
        type="text"
        placeholder="last name"
        onChange={(e) => setLastName(e.target.value)}
      ></input>
      <br/>
      <br/>
      <div>
        <button
          onClick={() => handleSubmit()}
          className="registration submit-button"
          type="submit"
        >
          Submit
        </button>
        <label>
          <input
            className="registration marketing-emails"
            type="checkbox"
            checked={allowMarketingEmails}
            onChange={() => toggleAllowMarketingEmails()}
          />
          Want to be notified about events & discounts?
        </label>
      </div>
      <br />
      <div className="to-login">
        <div>Already have an account?</div>
        <Link to="/login">Login</Link>
      </div>
    </div>
  );
};
If you answered no, you’re right, because it could change all the time.

So to fix this, we have to give it a stable component through which to depend on.

And that’s going to be selectors.

How to use selectors (constant contracts) to stabilize your UI
Selectors (or constant contracts) are basic JSON objects which stabilize the connection between your page object test code and your UI.

They act as a form of dependency inversion.

Here’s how it works.

We strip out and encapsulate everything that varies within a constant.

packages/frontend/shared/selectors/index.ts

export const appSelectors = {
  registration: {
    registrationForm: {
      email: { selector: ".registration.email", type: "input" },
      username: { selector: ".registration.username", type: "input" },
      firstname: { selector: ".registration.first-name", type: "input" },
      lastname: { selector: ".registration.last-name", type: "input" },
      marketingCheckbox: {
        selector: ".registration.marketing-emails",
        type: "checkbox",
      },
      submit: { selector: ".registration.submit-button", type: "button" },
    },
  },
  header: { selector: ".header.username", type: "div" },
  notifications: {
    failure: "#failure-toast",
    success: "#success-toast",
  },
};
Note that the object key part of this is what is most stable and the value may change, but that’s okay, because these values change in one place, and we shield those changes from rippling on elsewhere.

This means we adjust the way we hook up the Page Objects as well.

import { PuppeteerPageDriver } from "../driver";
import { PageObject } from "./pageObject";
import { PageElements, PageElementsConfig } from "../components";
import { CreateUserParams } from "@dddforum/shared/src/api/users";
import { appSelectors } from "@dddforum/frontend/src/shared/selectors";

export class RegistrationPage extends PageObject {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver, "<http://localhost:5173/join>");
    this.elements = new PageElements(
      appSelectors.registration.registrationForm as PageElementsConfig,
      driver,
    );
  }

  async enterAccountDetails(params: CreateUserParams) {
    await this.elements.get("email").then((e: any) => e.type(params.email));
    await this.elements.get("username").then((e: any) => e.type(params.username));
    await this.elements.get("firstname").then((e: any) => e.type(params.firstName));
    await this.elements.get("lastname").then((e: any) => e.type(params.lastName));
  }

  async acceptMarketingEmails() {
    await this.elements.get("marketingCheckbox").then((e: any) => e.click());

  }

  async submitRegistrationForm() {
    await this.elements.get("submit").then((e: any) => e.click());
  }
}

Finally, in the React components, we rely directly on the selectors instead of the hard-coded values.

Boom. Values in one place. Selectors (constant contract) acting as the stable dependency. Grand.

return (
    <div>
      <input
        className={toClass(selectors.email.selector)}
        type="email"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      ></input>
      <input
        className={toClass(selectors.username.selector)}
        type="text"
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      ></input>
      <input
        className={toClass(selectors.firstname.selector)}
        type="text"
        placeholder="first name"
        onChange={(e) => setFirstName(e.target.value)}
      ></input>
      <input
        className={toClass(selectors.lastname.selector)}
        type="text"
        placeholder="last name"
        onChange={(e) => setLastName(e.target.value)}
      ></input>
      <br/>
      <br/>
      <div>
        <button
          onClick={() => handleSubmit()}
          className={toClass(selectors.submit.selector)}
          type="submit"
        >
          Submit
        </button>
        <label>
          <input
            className={toClass(selectors.marketingCheckbox.selector)}
            type="checkbox"
            checked={allowMarketingEmails}
            onChange={() => toggleAllowMarketingEmails()}
          />
          Want to be notified about events & discounts?
        </label>
      </div>
      <br />
      <div className="to-login">
        <div>Already have an account?</div>
        <Link to="/login">Login</Link>
      </div>
    </div>
We also make use of some utility functions to strip and present the selector values.

export function toClass(input: string): string {
  // Remove the leading dot and replace all remaining dots with spaces
  return input.slice(1).replace(/\\./g, " ");
}

export function toId(input: string): string {
  if (!input.startsWith("#")) {
    throw new Error("Input string must start with a hash symbol (#).");
  }

  // Remove the leading hash symbol
  return input.slice(1);
}
Congratulations, you’ve massively stabilized your E2E code.

As long as you keep these selectors unique (which should be much easier to do from a single location), you’re going to have much less trouble writing stable E2E tests.

Of course, we’ve still got loading issues and timeouts to deal with, but this is much, much better from a design perspective.

Nice work!

Your Turn!
That’s going to do it for this submodule. Wrapping up…

Specifically, make sure you’ve set up the following.

✅ I have created a simple contract layer using a constant (selectors) contract

✅ I have ensured that the frontend implements the constants contract to implement components

✅ I have a test rig uses the constants contract to denote selectors

Summary
The stable component principle states that a component should either be stable or non-stable. Stable components act as building blocks through which non-stable components ground off of.
Selectors are stable components which enable our page objects (unstable) and our React components (stable) to ground off of.
 