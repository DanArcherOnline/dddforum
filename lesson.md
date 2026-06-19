# 💥 Action: Assignment Submission - UI to DB (Acceptance Testing a Walking Skeleton)

_Last updated: July 7th, 2024_

_Estimated time to complete: 2-4 hours_

## Context

Now that we know how to E2E test on the backend…

And we’ve got the architecture for a scalable test rig between backend and frontend…

It’s time to get your UI tests completed.

Let’s practice writing non-flaky E2E tests.

## What you’ll practice

> _Using the new shared acceptance test specification for DDDForum, execute UI tests which verify that the system achieves the goals of the customer from the perspective of the user._

## Pre-requisites

In order to complete this assignment, you’ll need to know how to do the following first:

- ✨ How to write acceptance tests using gherkin
- ✨ How to write idempotent tests
- ✨ How to setup edge cases using database fixtures
- ✨ How to use use tagging & filtering to selectively run acceptance tests between frontend and backend
- ✨ How to write Web Based E2e Tests
  - How to use the page object pattern to express a model of your UI
  - How to use puppeteer as a protocol driver
- ✨ How to use contracts to make your frontend E2E tests non-flaky

## Requirements

### The marketing opt in

Recall that we have a few changes to make to the frontend; this is the result of the new acceptance test.

The main change is you’ll notice is the need for an opt-in form.

_See the image below\._

When users register, if selected, we must also add their email to the contact list for the marketing team.

You should have already built the backend api for the `addContactToList` feature.

### Tagging & filtering

One of the awesome things about using shared acceptance tests is that you can write them all in one place, but selectively decide which tests you’ll execute.

In fact, for your assignment, you’re only going to run 3 of the 5 acceptance test scenarios.

You’ll do this using gherkin tagging and filtering.

```gherkin
Feature: Registration
  As a new user,
  I want to register as a Member
  So that I can vote on posts, ask questions, and earn points for discounts.

  @backend @frontend
  Scenario: Successful registration with marketing emails accepted
	Given I am a new user
	When I register with valid account details accepting marketing emails
	Then I should be granted access to my account
	And I should expect to receive marketing emails

  # Success scenarios
  @backend
  Scenario: Successful registration without marketing emails accepted
    Given I am a new user
	When I register with valid account details declining marketing emails
	Then I should be granted access to my account
	And I should not expect to receive marketing emails

  # Failure scenarios
  @backend @frontend
  Scenario: Invalid or missing registration details
    Given I am a new user
    When I register with invalid account details
    Then I should see an error notifying me that my input is invalid
    And I should not have been sent access to account details

  @backend @frontend
  Scenario: Account already created with email
    Given a set of users already created accounts
      | firstName | lastName | email             |
      | John      | Doe      | john@example.com  |
      | Alice     | Smith    | alice@example.com |
      | David     | Brown    | david@example.com |
    When new users attempt to register with those emails
    Then they should see an error notifying them that the account already exists
    And they should not have been sent access to account details

  Scenario: Username already taken
    Given a set of users have already created their accounts with valid details
      | firstName | lastName | username     | email              |
      | John      | Doe      | thechosenone | john1@example.com  |
      | Alice     | Smith    | chillblinton | alice2@example.com |
      | David     | Brown    | greenday     | david3@example.com |
    When new users attempt to register with already taken usernames
      | firstName | lastName | username     | email                 |
      | Bill      | Bob      | thechosenone | billy@billbob.com     |
      | Max       | Samson   | chillblinton | maxsamson@example.com |
      | Will      | Steff    | greenday     | willsteff@example.com |
    Then they see an error notifying them that the username has already been taken
    And they should not have been sent access to account details
```

### UI testing layers

Just like we have layers for the backend acceptance testing rig, we have layers for the frontend.

The backend rig looks like:

- _acceptance test spec_
- _executable spec_
- _apiClient (domain specific language)_
- _http (protocol driver)_

Whereas with the frontend, it looks more like:

- _acceptance test spec (same one)_
- _executable spec (different one)_
- _page objects (domain specific language)_
- _puppeteer (protocol driver)_

Let’s talk about the new layers in brief.

### Page Objects (the domain specific language on the frontend)

On the frontend, the domain specific language layer involves the use of page objects.

These are objects that you will design using, yet again — the element of _Programming By Wishful Thinking_.

Focused only on expressing _a model of the UI_ in the most natural language possible, they’re the first layer of abstraction from your test code on the path to your UI.

Here’s an example of what a test could look like, using page objects.

```tsx
test('Invalid or missing registration details', ({ given, when, then, and }) => {
  given('I am a new user', async () => {
    user = new CreateUserBuilder()
      .withAllRandomDetails()
      .withEmail('skj')
      .build();
  
    await pages.registration.open();
    await pages.registration.acceptMarketingEmails();
  });

  when('I register with invalid account details', async () => {
    await pages.registration.enterAccountDetails(user);
    await pages.registration.submitRegistrationForm();
  });

  then('I should see an error notifying me that my input is invalid', async () => {
    expect(await app.notifications.getErrorNotificationText()).toBeDefined();
    expect(await app.notifications.getErrorNotificationText()).toContain('invalid');
  });
});
```

To begin, you’ll need to start with _faith_ that it’ll work.

Then you **make it work**. That's the recurring idea, if you haven’t caught onto it yet, with working top-down.

### Protocol driver layer w/ puppeteer

What’s under the page object (domain specific language) layer?

The protocol driver layer.

This is the final layer that does the work before we cross over some serious architectural boundaries from **our acceptance test rig** to the **react code**.

Just like how we use **axios** to handle the super low-level work of _http requests_ and whatnot, we use **puppeteer** to handle the _clicks and presses complexity_ of dealing with a UI

Perhaps the biggest reason why most struggle with E2e acceptance testing is because this mix of concerns between layers.

Going from acceptance to test code to domain specific modelling code to ui clicks and presses code. That’s a lot of abstraction.

But we’ll decouple them into layers properly.

```tsx
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
```

### Contractualizing to reduce flakiness

Using 4 layers helps, totally and certainly, but you’re still going to encounter the problem of test flakiness.

Tools like Kent C Dodds’ react-testing-library actually follow the principles we’ll learn about here, but essentially, you need to contractualize the conversation between your acceptance test rig and your UI code.

To do so, we do the same things we always do. We introduce a contract.

In this case, we’ll use a constant contract.

Also known as **selectors**.

## Steps: How to complete this exercise

### **Step 1. Set up your project**

1. (If you haven't already) [clone the template to your GitHub and download it to your machine](https://github.com/stemmlerjs/the-software-essentialist)
2. Go to the project folder for this assignment (head [here](https://github.com/stemmlerjs/the-software-essentialist/tree/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart1/exercises/1_RefactoringTo4Tiers) to see it on GitHub).
3. npm install
4. Set up your terminals (one for running tests, one for committing)
5. Create a new branch (ex: _UItoDB_) using git checkout -b
6. Get started in the _start_ folder

### Step 2: Write the executable specification

Once you’ve got your project set up, you’ve got your acceptance test in the acceptance testing rig configured, and you’ve got the tagging set up properly, you should have all the empty tests in your `registration.e2e.ts`.

We’ll start with the success case.

```tsx
test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  given('I am a new user', async () => {
    ///
  });

  when('I register with valid account details accepting marketing emails', async () => {
    // 
  });

  then('I should be granted access to my account', async () => {
    // 
  });

  and('I should expect to receive marketing emails', () => {
    // @See backend
  });
});
```

The important collaborations you’ll have to design at this level of abstraction are:

- _the builders (to set up fixtures)_
- _the page object which describes your application_
- and, you’ll need to pass a **wrapper** for the puppeteer page driver you’re going to create

Your executable specification could look something like the following:

```tsx
let app: App
let pages: Pages;
let puppeteerPageDriver: PuppeteerPageDriver;
let createUserCommand: CreateUserCommand;
let databaseFixture: DatabaseFixture;

beforeAll(async () => {
  databaseFixture = new DatabaseFixture();
  puppeteerPageDriver = await PuppeteerPageDriver.create({ 
    headless: false,
    slowMo: 50,
  });
  app = createAppObject(puppeteerPageDriver);
  pages = app.pages;
  await databaseFixture.resetDatabase();
});

afterAll(async () => {
  await puppeteerPageDriver.browser.close();
});

afterEach(async () => {
  await databaseFixture.resetDatabase();
});

// Need to put timeout here.
jest.setTimeout(60000);

test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  
  given('I am a new user', async () => {
    createUserCommand = new CreateUserCommandBuilder()
      .withFirstName('Khalil')
      .withLastName('Stemmler')
      .withRandomUsername()
      .withRandomEmail()
      .build();
  
    await pages.registration.open();
    await pages.registration.acceptMarketingEmails();
  });

  when('I register with valid account details accepting marketing emails', async () => {
    await pages.registration.enterAccountDetails(createUserCommand);
    await pages.registration.submitRegistrationForm();
  });

  then('I should be granted access to my account', async () => {
    expect(await app.header.getUsernameFromHeader()).toContain(createUserCommand.username);
  });

  and('I should expect to receive marketing emails', () => {
    // @See backend
  });
});
```

Once you’ve set up your test and it fails (because you haven’t implemented the objects yet), we can move along.

### Step 3: Setting up the page object (DSL layer)

Remember that the page object is the _domain specific language_ layer, which means that everything looks and feels like a model of the UI.

To create the page objects, we can use a single factory function.

_tests/support/pages.ts_

```tsx
import { AppNotifications, HeaderComponent  } from "../components";
import { PuppeteerPageDriver } from "../driver";
import { RegistrationPage } from "./registrationPage";

export interface App {
  pages: Pages;
  header: HeaderComponent;
  notifications: AppNotifications;
}

interface Pages {
  registration: RegistrationPage;
}

export function createAppObject(pageDriver: PuppeteerPageDriver): App {  
  return {
    pages: {
      registration: new RegistrationPage(pageDriver)
    },
    header: new HeaderComponent(pageDriver),
    notifications: new AppNotifications(pageDriver)
  }
}
```

And for demonstration purposes, here’s what the registration page object might look like when you get this going.

_tests/support/registrationPage.ts_

```tsx
import { CreateUserCommand } from "@dddforum/shared/src/api";
import { PageElements } from "../components/component";
import { PuppeteerPageDriver } from "../driver/puppeteerPageDriver";
import { PageObject } from "./pageObject";

export class RegistrationPage extends PageObject {
  
  private elements: PageElements;

  constructor (driver: PuppeteerPageDriver) {
    super(driver, '<http://localhost:4000/join>');
    // To be implemented
  }

  async enterAccountDetails (command: CreateUserCommand) {
    // to be implemented
  }

  async acceptMarketingEmails () {
    // to be implemented
  }

  async submitRegistrationForm () {
    // to be implemented
  }

}
```

Also important to note is the base class. Upon creating three different page objects, it became clear that we were duplicating code, so it was wise to move that logic to an abstract class.

We’ll continue to use this to build future page objects.

_tests/support/pageObject.ts_

```tsx

import { PuppeteerPageDriver } from "../driver";

export abstract class PageObject {
  protected driver: PuppeteerPageDriver;
  public url: string;

  constructor (driver: PuppeteerPageDriver, url: string) {
    this.driver = driver;
    this.url = url;
  }

  public async open () {
    await this.driver.page.goto(this.url);
  }
}
```

### Step 4: Protocol Driver Layer (Puppeteer)

We’ve been passing the PuppeteerPageDriver thing around a fair amount.

Let’s see what it is:

_support/driver/puppeteerPageDriver.ts_

```tsx
import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';

export class PuppeteerPageDriver {
  constructor(public browser: Browser, public page: Page) {}

  public static async create(_options?: PuppeteerLaunchOptions) {
    const browserInstance = await puppeteer.launch(_options);
    const page = await browserInstance.newPage();
    return new PuppeteerPageDriver(browserInstance, page);
  }
}
```

Essentially, with this object, we’ve _Horizontally Decoupled (encapsulated)_ access to puppeteer through an interface to make it easier to work with.

Astute developers would notice that it’d be a good idea to turn this into a singleton as well, for good measure, but I’ll leave that to you.

So how do you use it?

Well, if we go back the RegistrationPage, we can start to fill it in with target clicks and presses that we intent to make.

```tsx
import { CreateUserCommand } from "@dddforum/shared/src/api";
import { PageElements } from "../components/component";
import { PuppeteerPageDriver } from "../driver/puppeteerPageDriver";
import { PageObject } from "./pageObject";

export class RegistrationPage extends PageObject {
  
  private elements: PageElements;

  constructor (driver: PuppeteerPageDriver) {
    super(driver, '<http://localhost:4000/join>');
    this.elements = new PageElements({
      email: { selector: '.registration.email', type: 'input' },
      username: { selector: '.registration.username', type: 'input' }, 
      firstname: { selector: ".registration.first-name", type: 'input' },
      lastname: { selector: ".registration.last-name", type: 'input' },
      marketingCheckbox: { selector: '.registration.marketing-emails', type: 'checkbox' },
      submit: { selector: '.registration.submit-button', type: 'button' },
    }, driver)
  }

  async enterAccountDetails (command: CreateUserCommand) {
    await this.elements.get('email').then((e) => e.type(command.email));
    await this.elements.get('username').then((e) => e.type(command.username))
    await this.elements.get('firstname').then((e) => e.type(command.firstName))
    await this.elements.get('lastname').then((e) => e.type(command.lastName))
  }

  async acceptMarketingEmails () {
    await this.elements.get('marketingCheckbox').then((e) => e.click());
  }

  async submitRegistrationForm () {
    await this.elements.get('submit').then((e) => e.click());
  }
}
```

You’ll notice that I am _yet again_, applying _Horizontal Decoupling_ to encapsulate the clicking and pressing work behind something called _PageElements_.

Why do I do this?

If the API isn’t easy to use, if it doesn’t _feel_ English and declarative enough — or if leaks a lot of abstraction, my initial tendency is to wrap it in another abstraction layer to make it more manageable.

Here’s what ended up emerging as a result of **moving complexity downwards**.

_support/components/component.ts_

```typescript

import { PuppeteerPageDriver } from "../driver";

type ElementType = "input" | "button" | "div" | "checkbox";

export type PageElementsSelector = { selector: string; type: ElementType } | Component;

export interface PageElementsConfig {
  [key: string]: PageElementsSelector;
}

export abstract class Component {
  constructor (protected driver: PuppeteerPageDriver) {
   
  }
}

export class PageElements {
  constructor(
    private config: PageElementsConfig,
    private driver: PuppeteerPageDriver
  ) {}

  async get(nameKey: string, timeout?: number) {
    const component = this.config[nameKey];
    let element;

    if (component instanceof Component) {
      return component
    }

    try {
      element = await this.driver.page.waitForSelector(component.selector, { timeout });
    } catch (err) {
      console.log("Element not found");
      throw new Error(`Element ${nameKey} not found!`);
    }

    if (!element) {
      throw new Error(
        `Could not load component's element ${nameKey}: maybe it's not on the page yet.`
      );
    }

    return element;
  }
}
```

Notice how I’m always focused on the developer experience?

Remember: **what’s easy to use, gets used**.

You’ll want to also set up the other page objects masquerading as components, like the Header.

```tsx
import { PuppeteerPageDriver } from "../driver/puppeteerPageDriver";
import { Component, PageElements } from "./component";

export class HeaderComponent extends Component {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver);
    this.elements = new PageElements({
      header: { selector: '.header.username', type: 'div' },
    }, driver)
  }

  async getUsernameFromHeader () {
    let usernameElement = await this.elements.get('header');
    return usernameElement?.evaluate((e) => e.textContent);
  }
}
```

Now, it’s time to look at the code across the architectural boundary — the React code.

### Step 7: Adjust your React code to make the feature work

Notice that we are **only now** thinking about React.

Up until now, we should not have been looking at any React code.

Why?

**_Because you’re working top down_**_._

Ideally, if we were starting from scratch, your React code should have **emerged as a result of the test we’d just written**.

But since we’re retro-fitting our code to work with the tests, let’s adjust the selectors now.

You’ll have to adjust the:

- _header_
- _mainPage_
- _registrationForm_

Here’s the form with the main selectors and the new email marketing code.

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { CreateUserCommand } from '@dddforum/shared/src/api/users'

interface RegistrationFormProps {
  onSubmit: (formDetails: CreateUserCommand, allowMarketingEmails: boolean) => void;
}

export const RegistrationForm = (props: RegistrationFormProps) => {
  const [email, setEmail] = useState("email");
  const [username, setUsername] = useState("username");
  const [firstName, setFirstName] = useState("firstName");
  const [lastName, setLastName] = useState("lastName");
  const [allowMarketingEmails, setAllowMarketingEmails] = useState(false);

  const toggleAllowMarketingEmails = () => {
    setAllowMarketingEmails(!allowMarketingEmails);
  };

  const handleSubmit = () => {
    props.onSubmit({
      email,
      username,
      firstName,
      lastName,
    }, allowMarketingEmails);
  };

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
```

And extending the registration function, our code might look something like the following:

```tsx
export const RegisterPage = () => {
  const { setUser } = useUser();
  const navigate = useNavigate()
  const spinner = useSpinner();

  const handleSubmitRegistrationForm = async (input: CreateUserCommand, addToList: boolean) => {
    // Validate the form
    const validationResult = validateForm(input);

    // If the form is invalid
    if (!validationResult.success) {
      // Show an error toast (for invalid input)
      return toast.error(validationResult.errorMessage, {
        toastId: `failure-toast`
      });
    }

    spinner.activate();

    try {
      const response = await api.users.register(input);

      if (!response.success) {
        switch (response.error) {
          case "AccountAlreadyExists":
            spinner.deactivate();
            return toast.error('Account already exists', { toastId: `failure-toast` });
          case "EmailAlreadyInUse":
            spinner.deactivate();
            return toast.error('Email already in use', { toastId: `failure-toast` });
          default:
            // Client processing error
            throw new Error('Client')
        }
      }
      
      if (addToList) {
        await api.marketing.addEmailToList(input.email);
      }

      // Save the user details to the cache
      setUser(response.data as any);
      // Stop the loading spinner
      spinner.deactivate();
      // Show the toast
      toast('Success! Redirecting home.', {
        toastId: `success-toast`
      })
      // In 3 seconds, redirect to the main page
      setTimeout(() => { navigate('/') }, 3000)
    } catch (err) {
      // If the call failed
      // Stop the spinner
      spinner.deactivate();
      // Show the toast (for unknown error)
      return toast.error('Some backend error occurred', {
        toastId: `failure-toast`
      });
    }

  };

  return (
    <Layout>
      <ToastContainer/>
      <div>Create Account</div>
      <RegistrationForm
        onSubmit={(input: CreateUserCommand, allowMarketingEmails: boolean) =>
          handleSubmitRegistrationForm(input, allowMarketingEmails)
        }
      />
      <OverlaySpinner isActive={spinner.spinner?.isActive}/>
    </Layout>
  );
};
```

### Step 6: Continue with the edge cases

Great! You’ve been able to get the feature to work, top-down for the easiest case.

Now make the other 2 scenarios we filter on work as well.

```gherkin
Feature: Registration
  As a new user,
  I want to register as a Member
  So that I can vote on posts, ask questions, and earn points for discounts.

  @backend @frontend
  Scenario: Successful registration with marketing emails accepted
	Given I am a new user
	When I register with valid account details accepting marketing emails
	Then I should be granted access to my account
	And I should expect to receive marketing emails

  # Success scenarios
  @backend 
  Scenario: Successful registration without marketing emails accepted
    Given I am a new user
	When I register with valid account details declining marketing emails
	Then I should be granted access to my account
	And I should not expect to receive marketing emails

  # Failure scenarios
  @backend @frontend
  Scenario: Invalid or missing registration details
    Given I am a new user
    When I register with invalid account details
    Then I should see an error notifying me that my input is invalid
    And I should not have been sent access to account details

  @backend @frontend
  Scenario: Account already created with email
    Given a set of users already created accounts
      | firstName | lastName | email             |
      | John      | Doe      | john@example.com  |
      | Alice     | Smith    | alice@example.com |
      | David     | Brown    | david@example.com |
    When new users attempt to register with those emails
    Then they should see an error notifying them that the account already exists
    And they should not have been sent access to account details

  Scenario: Username already taken
    Given a set of users have already created their accounts with valid details
      | firstName | lastName | username     | email              |
      | John      | Doe      | thechosenone | john1@example.com  |
      | Alice     | Smith    | chillblinton | alice2@example.com |
      | David     | Brown    | greenday     | david3@example.com |
    When new users attempt to register with already taken usernames
      | firstName | lastName | username     | email                 |
      | Bill      | Bob      | thechosenone | billy@billbob.com     |
      | Max       | Samson   | chillblinton | maxsamson@example.com |
      | Will      | Steff    | greenday     | willsteff@example.com |
    Then they see an error notifying them that the username has already been taken
    And they should not have been sent access to account details
```

### Step 7: Introduced the constant contract to improve test stability

Now that you’ve got your tests up and running, it’s time to set up a constant contract, using _dependency inversion_ properly.

Load all of the selectors from your Page Objects / test components into a selectors file.

_packages/frontend/shared/selectors/index.ts_

```tsx

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
  header: { selector: '.header.username', type: 'div' },
  notifications: {
    failure: '#failure-toast',
    success: '#success-toast'
  }
};

export function toClass(input: string): string {  
  // Remove the leading dot and replace all remaining dots with spaces
  return input.slice(1).replace(/\\./g, ' ');
}

export function toId(input: string): string {
  if (!input.startsWith('#')) {
    throw new Error("Input string must start with a hash symbol (#).");
  }
  
  // Remove the leading hash symbol
  return input.slice(1);
}
```

And in your registration page, you’re going to use invert the dependency relationship by relying directly on the selectors rather than on strings.

```tsx
import { CreateUserCommand } from "@dddforum/shared/src/api/users";
import { PageElements, PageElementsConfig } from "../components/component";
import { PuppeteerPageDriver } from "../driver/puppeteerPageDriver";
import { PageObject } from "./pageObject";
import { appSelectors } from "@dddforum/frontend/src/shared/selectors";

export class RegistrationPage extends PageObject {
  private elements: PageElements;

  constructor(driver: PuppeteerPageDriver) {
    super(driver, "<http://localhost:4000/join>");
    this.elements = new PageElements(
      appSelectors.registration.registrationForm as PageElementsConfig,
      driver,
    );
  }

  async enterAccountDetails(command: CreateUserCommand) {
    await this.elements.get("email").then((e) => e.type(command.email));
    await this.elements.get("username").then((e) => e.type(command.username));
    await this.elements.get("firstname").then((e) => e.type(command.firstName));
    await this.elements.get("lastname").then((e) => e.type(command.lastName));
  }

  async acceptMarketingEmails() {
    await this.elements.get("marketingCheckbox").then((e) => e.click());
  }

  async submitRegistrationForm() {
    await this.elements.get("submit").then((e) => e.click());
  }
}
```

Do the same thing in any and all react components used in your tests, such as the RegistrationForm.

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { CreateUserCommand } from '@dddforum/shared/src/api/users'
import { appSelectors, toClass } from "../shared/selectors";

interface RegistrationFormProps {
  onSubmit: (formDetails: CreateUserCommand, allowMarketingEmails: boolean) => void;
}

export const RegistrationForm = (props: RegistrationFormProps) => {

  const selectors = appSelectors.registration.registrationForm;

  const [email, setEmail] = useState("email");
  const [username, setUsername] = useState("username");
  const [firstName, setFirstName] = useState("firstName");
  const [lastName, setLastName] = useState("lastName");
  const [allowMarketingEmails, setAllowMarketingEmails] = useState(false);

  const toggleAllowMarketingEmails = () => {
    setAllowMarketingEmails(!allowMarketingEmails);
  };

  const handleSubmit = () => {
    props.onSubmit({
      email,
      username,
      firstName,
      lastName,
    }, allowMarketingEmails);
  };

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
  );
};
```

Congratulations, you’ve massively stabilized your E2E code.

As long as you keep these selectors unique (which should be much easier to do from a single location), you’re going to have much less trouble writing stable E2E tests.

Of course, we’ve still got loading issues and timeouts to deal with, but this is much, much better from a design perspective.

Nice work!

## **How to know when you’re finished**

Use the following grading checklist to self-evaluate (and evaluate others' assignment submissions) to see the assignment has been done correctly.

### **Grading Checklist**

**Grading checklist**

**_4 Tiers Acceptance Test Rig_**

- **🔘** _I am using the tagging & exclusion feature to run only the following scenarios on the frontend_
  - _Successful registration w/ marketing emails accepted_
  - _Invalid or missing registration details_
  - _Account already created using email_
- **🔘** _I am using the acceptance test which lives in the shared folder to derive the tests for my frontend e2e tests_
- **🔘** _I have designed pageObjects that represent the conceptual model of the Ui using programming by wishful thinking_
- **🔘** _I have used puppeteer or cypress to implement the protocol driver which interfaces with the UI_
- **🔘** _I have re-organized and made use of a shared database fixture to control the state of my tests_
- **🔘** _I have made sure that my tests are_ ****_idempotent; I can run them over and over repeatedly_

**_3 Scenarios — Success & Failures_**

- **🔘 **_I have implemented the successful registration with marketing emails accepted scenario_
- **🔘** _I have implemented the invalid or missing registration details scenario_
- **🔘** _I have implemented the account already created with email_

**_Stabilization (constant contract w/ selectors)_**

- **🔘** _I have created a simple contract layer using a&#xA0;_<!---->_\_**_constant (selectors) contract_**
- **🔘** _I have ensured that the frontend&#xA0;_<!---->_**_implements_**_<!---->_&#xA0;the constants contract to implement components_
- _🔘 I have a test rig&#xA0;_<!---->_**_uses_**_<!---->_&#xA0;the constants contract to denote selectors_ 
