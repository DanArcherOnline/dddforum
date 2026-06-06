# Characterizing & Refactoring DDDForum to 4 Tiers

\#subjectVerification

_Last updated: August 29th, 2024_

_Topics: characterization testing, external services, 4 tiers, refactoring, collections, builders/fixtures_

_Major Topics: Behaviour-Driven Development, Test-Driven Development_

By now you’ve got your high value E2E test scripts running against your backend. And now you’re ready to characterize DDDForum using everything we’ve previously learned.

Let’s continue.

Here’s what we’ll cover in this lesson.

## Lesson goals

- ✨ How to get started characterizing DDDForum so you can refactor it to 4 tiers
- ✨ The patterns and layers of abstraction for the marketing API
- ✨ How to use builders to set up your test state that relies upon a collection of objects

## Where are we so far?

As I mentioned above, by now you should have the following acceptance test specification in your _shared_ package.

_shared/tests/features/registration.feature_

```gherkin
Feature: Registration
  As a new user,
  I want to register as a Member
  So that I can vote on posts, ask questions, and earn points for discounts.

  Scenario: Successful registration with marketing emails accepted
		Given I am a new user
		When I register with valid account details accepting marketing emails
		Then I should be granted access to my account
		And I should expect to receive marketing emails

  # Success scenarios
  Scenario: Successful registration without marketing emails accepted
    Given I am a new user
		When I register with valid account details declining marketing emails
		Then I should be granted access to my account
		And I should not expect to receive marketing emails

  # Failure scenarios
  Scenario: Invalid or missing registration details
    Given I am a new user
    When I register with invalid account details
    Then I should see an error notifying me that my input is invalid
    And I should not have been sent access to account details

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

While we use the same test for both the _backend_ and the _frontend_, we’re going to focus on the backend first.

If you peek into the codebase for the backend code, here’s probably what you’re going to see — something like this.

_src/index.ts_

```tsx
import express, { Request, Response } from 'express';
import { prisma } from './database';
import { User } from '@prisma/client';

const cors = require('cors')
const app = express();
app.use(express.json());
app.use(cors())

const Errors = {
  UsernameAlreadyTaken: 'UserNameAlreadyTaken',
  EmailAlreadyInUse: 'EmailAlreadyInUse',
  ValidationError: 'ValidationError',
  ServerError: 'ServerError',
  ClientError: 'ClientError',
  UserNotFound: 'UserNotFound'
}

function isMissingKeys (data: any, keysToCheckFor: string[]) {
  for (let key of keysToCheckFor) {
    if (data[key] === undefined) return true;
  } 
  return false;
}

function generateRandomPassword(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const passwordArray = [];

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    passwordArray.push(charset[randomIndex]);
  }

  return passwordArray.join('');
}

function parseUserForResponse (user: User) {
  const returnData = JSON.parse(JSON.stringify(user));
  delete returnData.password;
  return returnData;
}

// Create a new user
app.post('/users/new', async (req: Request, res: Response) => {
  try {
    const keyIsMissing = isMissingKeys(req.body, 
      ['email', 'firstName', 'lastName', 'username']
    );
    
    if (keyIsMissing) {
      return res.status(400).json({ error: Errors.ValidationError, data: undefined, success: false })
    }

    const userData = req.body;
    
    const existingUserByEmail = await prisma.user.findFirst({ where: { email: req.body.email }});
    if (existingUserByEmail) {
      return res.status(409).json({ error: Errors.EmailAlreadyInUse, data: undefined, success: false })
    }

    const existingUserByUsername = await prisma.user.findFirst({ where: { username: req.body.username as string }});
    if (existingUserByUsername) {
      return res.status(409).json({ error: Errors.UsernameAlreadyTaken, data: undefined, success: false })
    }

    const { user, member } = await prisma.$transaction(async (tx) => {
      const user = await prisma.user.create({ data: { ...userData, password: generateRandomPassword(10) } });
      const member = await prisma.member.create({ data: { userId: user.id }})
      return { user, member }
    })
    
    return res.status(201).json({ error: undefined, data: parseUserForResponse(user), success: true });
  } catch (error) {
    console.log(error)
    // Return a failure error response
    return res.status(500).json({ error: Errors.ServerError, data: undefined, success: false });
  }
});

// Get a user by email
app.get('/users', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (email === undefined) {
      return res.status(400).json({ error: Errors.ValidationError, data: undefined, success: false })
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: Errors.UserNotFound, data: undefined, success: false })
    }

    return res.status(200).json({ error: undefined, data: parseUserForResponse(user), succes: true });
  } catch (error) {
    return res.status(500).json({ error: Errors.ServerError, data: undefined, success: false });
  }
});

// Get posts
app.get('/posts', async (req: Request, res: Response) => {
  try {
    const { sort } = req.query;
    
    if (sort !== 'recent') {
      return res.status(400).json({ error: Errors.ClientError, data: undefined, success: false })
    } 

    let postsWithVotes = await prisma.post.findMany({
      include: {
        votes: true, // Include associated votes for each post
        memberPostedBy: {
          include: {
            user: true
          }
        },
        comments: true
      },
      orderBy: {
        dateCreated: 'desc', // Sorts by dateCreated in descending order
      },
    });

    return res.json({ error: undefined, data: { posts: postsWithVotes }, success: true });
  } catch (error) {
    return res.status(500).json({ error: Errors.ServerError, data: undefined, success: false });
  }
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

Let’s get to work.

## Characterizing the first successful registration scenario

Let’s take the first scenario — the **successful registration** scenario.

```gherkin
Feature: Registration
  As a new user,
  I want to register as a Member
  So that I can vote on posts, ask questions, and earn points for discounts.

  Scenario: Successful registration with marketing emails accepted
		Given I am a new user
		When I register with valid account details accepting marketing emails
		Then I should be granted access to my account
		And I should expect to receive marketing emails
```

Now, notice that this talks about **marketing** and whatnot, but we don’t actually have that in our implementation yet.

That’s okay.

This is still a characterization test, but it’s more like we’ll _stretch_ the code to conform to the new contract. So it’s a bit of existing functionality and new functionality at the same time.

So, let’s set it up.

Getting the executable specification going, you should have something like this.

_tests/e2e/registration.spec.ts_

```tsx
test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  given('I am a new user', async () => {
  });

  when('I register with valid account details accepting marketing emails', async () => {
  });

  then('I should be granted access to my account', async () => {
  });

  and('I should expect to receive marketing emails', () => {
  });
});
```

### To use flags or not?

Now, there’s something interesting going on here.

In terms of delivering on the state change where we both **create the user** AND **add them to an email list**, we have the option of either:

1. **Modelling the API call a single API call with a flag for marketing emails**

   Which would look something like:

   ```tsx
   POST /users/new

   { 
   	body: { 
   		username: 'jimjones', 
   		email: 'jimjones@gmail.com', 
   		firstName: 'Jim', 
   		lastName: 'Jones',
   		addToEmailList: true
   	} 
   }
   ```

Or we could take a different route.

1. **Separate API calls for createUser** and **addToContactList**

   Which would look more like the following:

   ```tsx
   POST /users/new

   { 
   	body: { 
   		username: 'jimjones', 
   		email: 'jimjones@gmail.com', 
   		firstName: 'Jim', 
   		lastName: 'Jones'
   	} 
   }

   POST /marketing/new

   { 
   	body: { 
   		email: 'jimjones@gmail.com'
   	} 
   }
   ```

This is a common enough problem that you’ll encounter.

Which one do you think is better?

Well, clearly the first option is easier in the short term because all you have to do is add a boolean flag and you don’t need a separate API call. For sure.

But if you look closely, you’ll notice that the first option is a clear **cohesion/abstraction/metaphysics** violation — we’re conflating two entirely separate _Capabilities_ into one feature, which is bound to create problems for us down the road.

So, option #2 appears to be a better approach — to continue to maintain clear Vertical Slices of Capability → Features.

Don’t underestimate the power of high level metaphysical thinking like this. It’s the small stuff that snowballs into big stuff over time.

So we’ll make two API calls.

### Writing the assert

As you know by now, I prefer to start from the end.

How will we model “I should expect to receive marketing emails”?

Well, clearly, we’ll need a response object.

```tsx
test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  let createUserResponse: any = {};
  let addEmailToListResponse: any = {};
  
  given('I am a new user', async () => {
  });

  when('I register with valid account details accepting marketing emails', async () => {
  
  });

  then('I should be granted access to my account', async () => {
	  expect(createUserResponse.status).toBe(201);
  });

  and('I should expect to receive marketing emails', () => {
	  expect(addEmailToListResponse.status).toBe(201);
  });
});
```

That’s the most basic form of the **assert**, and we can improve it as we go for sure.

How? By continuing to add to the Result Verification we practice, of course.

For example, for the “I should be granted access to my account”, we use the intended shape of the object we get back.

```tsx
then('I should be granted access to my account', async () => {
  // Result verification
  const { data } = createUserResponse.body
  expect(createUserResponse.status).toBe(201);
  expect(data!.id).toBeDefined();
  expect(data!.email).toEqual(user.email);
  expect(data!.firstName).toEqual(user.firstName);
  expect(data!.lastName).toEqual(user.lastName);
  expect(data!.username).toEqual(user.username);
});
```

This is all pretty standard for us by now, so let’s move on.

### Writing the act

We said two API calls, right?

Let’s see what that looks like. Something like this is sufficient:

```tsx
let createUserInput: CreateUserInput;

...

when('I register with valid account details accepting marketing emails', async () => {
  createUserResponse = await request(app)
    .post("/users/new")
    .send(createUserCommand);
    
  addEmailToListResponse = await request(app)
    .post("/marketing/new")
    .send({ email: createUserCommand.email });
});
```

Just to be clear — this route **doesn’t exist yet**. I’m programming by wishful thinking right now. We’re working top-down and we’re going to get the production code to conform to the shape we’re looking for.

Also note: this is something we could actually improve (and we will improve later in this module) using a _shared API Client_. Why? Lots of great reasons with respect to stability, testing, contractualization and so on — we’ll cover that more later.

```tsx
let createUserInput: CreateUserInput;

...

// design using an API Client instead
when('I register with valid account details accepting marketing emails', async () => {
  createUserResponse = await apiClient.users.register(createUserInput);
  addEmailToListResponse = await apiClient.marketing.addEmailToList(createUserInput.email);
});
```

### Writing the arrange

Now the setup. Always fun with the builders, right?

Here’s something you should know — you can use **builders for anything**, not just the database state.

So, for example, if I wanted to simplify and abstract the way I create my inputs/params, I could do that as well.

```tsx
let createUserInput: CreateUserInput;
    
given('I am a new user', async () => {
  createUserInput = new CreateUserInputBuilder()
    .withAllRandomDetails()
    .build();
});
```

**Note**: There’s some discrepancy between params, inputs & commands. This will become more clear to you in the lesson on “End to End Type Safety”. Until then, you may see us refer to the input as “inputs”, “params” or “commands”. There are subtle differences. Continue to treat naming as a process. We’ll clarify and refine.

The builder might look something like what follows:

```tsx
import { CreateUserInput } from "@dddforum/shared/src/api/users";
import { TextUtil } from "@dddforum/shared/src/utils/textUtils";

export class CreateUserInputBuilder {
  private props: Partial<CreateUserInput>;

  constructor() {
    this.props = {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
    };
  }

  public withAllRandomDetails() {
	  // Note: You could also use faker.js
    this.withFirstName(TextUtil.createRandomText(10));
    this.withLastName(TextUtil.createRandomText(10));
    this.withEmail(TextUtil.createRandomEmail());
    this.withUsername(TextUtil.createRandomText(10));
    return this;
  }

  public withFirstName(firstName: string) {
    this.props = {
      ...this.props,
      firstName,
    };
    return this;
  }

  public withLastName(lastName: string) {
    this.props = {
      ...this.props,
      lastName,
    };
    return this;
  }

  public withEmail(email: string) {
    this.props = {
      ...this.props,
      email,
    };
    return this;
  }

  public withUsername(username: string) {
    this.props = {
      ...this.props,
      username,
    };
    return this;
  }

  public build() {
    return this.props;
  }
}
```

You may be thinking “we’ve been creating a lot of builders! What’s going to happen if we need builders for everything? That looks like it’s going to get extremely messy over time? There will be so many builders!”

Yes, we do tend to create a _lot_ of these over time. At some point, it’s a good idea to look into the _Abstract Factory Pattern_ to abstract the _creation of builders_ to a single place.

For example, here’s one potential design:

```tsx
new InputBuilder('users')
  .createUserInputBuilder()
  .withAllRandomDetails();
  .build();
```

In this example, the **primary** **metaphysical** **pivot point lies** between the **capability** and the **feature**.

But if we wanted, we could switch it up, pivoting a bit deeper and forcing the client to specify more upfront.

Here’s what I mean:

```tsx
new InputBuilder('users', 'createUser')
  .withAllRandomDetails();
  .build();
```

And of course, we’d make sure to use **strict types** for the two arguments. Such a design would **prompt (signs)** the client, forcing **constraints** on how this works, making it harder for them to misuse.

I recognize that this could be a little bit advanced because there are several concepts flying around here at once:

- _the builder pattern (the design pattern itself)_
- _abstraction, cohesion & metaphysics (determining where to pivot)_
- _programming by wishful thinking (starting with the implementation)_
- _design thinking (constraints & signs through the use of strict types)_

If you’re with me here, you’re doing really great.

Understand why it’s so hard to learn design patterns and put them into practice in a practical way? It’s much more common to read a big book of design patterns, then struggle to use them effectively, in a rigid sort of way. Lots of thinking and prior experience is required.

So, this is how I prefer to use design patterns. _As needed_.

### Putting it all together

**Putting it all together**, here’s what your executable specification could look like.

```kotlin
test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  let createUserInput: CreateUserInput;
  
  given('I am a new user', async () => {
    createUserInput = new CreateUserCommandBuilder()
      .withAllRandomDetails()
      .build();
  });

  when('I register with valid account details accepting marketing emails', async () => {
    createUserResponse = await request(app)
	    .post("/users/new")
	    .send(createUserInput);
    
	  addEmailToListResponse = await request(app)
	    .post("/marketing/new")
	    .send({ email: createUserInput.email });
  });

  then('I should be granted access to my account', async () => {
    const { data, success, error } = createUserResponse.body;

    // Result Verification
    expect(success).toBeTruthy();
    expect(error).toEqual({});
    expect(data!.id).toBeDefined();
    expect(data!.email).toEqual(user.email);
    expect(data!.firstName).toEqual(user.firstName);
    expect(data!.lastName).toEqual(user.lastName);
    expect(data!.username).toEqual(user.username);
  });

  and('I should expect to receive marketing emails', () => {
    const { success } = addEmailToListResponse.body
    expect(createUserResponse.status).toBe(201);
    expect(success).toBeTruthy();
  });
});
```

Make sure to use proper **idempotency** techniques like we discussed previously.

Also note that this _should_ fail until you set up the marketing route.

### Your turn!

Take a moment to get to that point and then continue forward.

## Building the 4 tiers of a new marketing API route

Let’s discuss this idea of the **marketing API** and the external service now.

To clarify, you’ll need:

- _a&#xA0;_<!---->_\_\_[_marketing controller_](https://github.com/stemmlerjs/the-software-essentialist/blob/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart3/assignment/end/packages/backend/src/modules/marketing/marketingController.ts)
- _a&#xA0;_<!---->_\_\_[_marketing service_](https://github.com/stemmlerjs/the-software-essentialist/blob/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart3/assignment/end/packages/backend/src/modules/marketing/marketingService.ts)
- _a&#xA0;_<!---->_[_contact list API_](https://github.com/stemmlerjs/the-software-essentialist/blob/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart3/assignment/end/packages/backend/src/modules/marketing/contactListAPI.ts)_<!---->_&#xA0;(used by the marketing service)_
- _a&#xA0;_<!---->_[_transactional email API_](https://github.com/stemmlerjs/the-software-essentialist/blob/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart3/assignment/end/packages/backend/src/modules/notifications/transactionalEmailAPI.ts)_<!---->_&#xA0;(used by the users service to send an email notification)_

At a high level, here’s how I see the design in your project:

- _users (…)_
- _notifications_
  - _transactionalAPI — this is the service which we use to send mails_
- _marketing_
  - _marketingController — this is the controller which handles requests_
  - _marketingService — this is the service which handles marketing requests_
  - _contactListAPI — this is the external service which makes outgoing requests to some paid service (ie: mailchimp, convertkit, xyz)_

“Wait, do you want me to actually sign up for a service like Mailchimp or Convertkit?”

No, I’m not going to make you do that if you don’t want. You can _fake_ the services so it feels real but it doesn’t actually do anything, like so:

```tsx
export class ContactListAPI {
  async addEmailToList(email: string): Promise<boolean> {
    // Do the actual work
    console.log(
      `MailchimpContactList: Adding ${email} list... for production usage.`,
    );
    return true;
  }
}
```

But do create these objects in practice, because it’ll be necessary when we get into “Advanced Testing” for swapping dependencies at runtime.

So set this stuff up.

Same structure.

_Route → Controller → Service → External Service_

Here’s what the controller might look like:

```tsx
import express from "express";
import { MarketingService } from "./marketingService";
import { AddEmailToListResponse } from "@dddforum/shared/src/api/marketing";
import { ErrorHandler } from "../../shared/errors";

export class MarketingController {
  private router: express.Router;

  constructor(
    private marketingService: MarketingService,
    private errorHandler: ErrorHandler,
  ) {
    this.router = express.Router();
    this.setupRoutes();
    this.setupErrorHandler();
  }

  getRouter() {
    return this.router;
  }

  private setupRoutes() {
    this.router.post("/new", this.addEmailToList.bind(this));
  }

  private setupErrorHandler() {
    this.router.use(this.errorHandler);
  }

  private async addEmailToList(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const email = req.body.email;
      const result = await this.marketingService.addEmailToList(email);
      const response: AddEmailToListResponse = {
        success: true,
        data: result,
        error: {},
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
```

And the service.

```tsx
import { ServerErrorException } from "../../shared/exceptions";
import { ContactListAPI } from "./contactListAPI";

export class MarketingService {
  constructor(private contactListAPI: ContactListAPI) {}

  async addEmailToList(email: string) {
    try {
      const result = await this.contactListAPI.addEmailToList(email);
      return result;
    } catch (err) {
      throw new ServerErrorException();
    }
  }
}
```

### Your turn!

Continue forward to set these objects up so your acceptance test passes.

And then continue with the next ones.

## Constructing a collection of test objects at once

As you keep continuing forward with the acceptance tests, you’ll get to this scenario.

```gherkin
Scenario: Account already created with email
    Given a set of users already created accounts
      | firstName | lastName | email             |
      | John      | Doe      | john@example.com  |
      | Alice     | Smith    | alice@example.com |
      | David     | Brown    | david@example.com |
    When new users attempt to register with those emails
    Then they should see an error notifying them that the account already exists
    And they should not have been sent access to account details
```

Ah yes, how to deal with the table of data?

Same as usual, it’s nice to start backwards to figure out **how this _could_ work.**

```tsx
then(
  "they see an error notifying them that the username has already been taken",
  () => {
    for (const response of createUserResponses) {
      expect(response.error).toBeDefined();
      expect(response.success).toBeFalsy();
      expect(response.error.code).toEqual("UsernameAlreadyTaken");
    }
  },
);

and("they should not have been sent access to account details", () => {
  createUserResponses.forEach((response) => {
    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error).toBeDefined();
  });
});
```

And in the **act**, what we we going to be doing? Making a bunch of requests, of course.

```tsx
let userInputs: CreateUserInput[] = [];
...

when(
  "new users attempt to register with already taken usernames",
  async (table) => {
    createUserResponses = await Promise.all(
      userInputs.map((userInput) => {
        return request(app)
	  .post("/users/new")
	  .send(userInput);
      }),
    );
  },
);
```

And how might we set that all up? How might we set up the state of the universe?

```tsx
beforeEach(async () => {
  await databaseFixture.resetDatabase();
});

...

let userInputs: CreateUserInput[] = [];

given("a set of users already created accounts", async (table) => {
  // 1. Create the input objects
  userInputs = table.map((row: any) => {
    return new CreateUserInputBuilder()
      .withFirstName(row.firstName)
      .withLastName(row.lastName)
      .withEmail(row.email)
      .build();
  });
  
  // 2. Ensure objects exist in the database
  await userCollectionBuilder
	  .fromUserInputs(userInputs)
	  .build();
});
```

Alternatively, a design like so would work as well. But you’d eventually need to decouple the stuff that has to do with _users_ from a single _databaseFixture_.

```tsx
given(
  "a set of users have already created their accounts with valid details",
  async (table) => {
    existingUsers = table.map((row: any) => {
      return new CreateUserBuilder()
        .withFirstName(row.firstName)
        .withLastName(row.lastName)
        .withEmail(row.email)
        .withUsername(row.username)
        .build();
    });
    await databaseFixture.setupWithExistingUsers(existingUsers);
  },
);
```

### Your Turn!

Give it a go. See if you can use what you know about builders, fixtures, and working backwards to complete this test.

## Finally, characterize to 4 tiers!

Finally, once you get all of the API calls characterized, your final task here is to characterize them all towards 4 tiers if you haven’t already been doing that slowly.

Organize as best as you can, we’ll return to that topic soon.

A short list of things that may work their way into your designs are:

- dtos
- services
- controllers
- external service APIs
- databaseConnections
- exceptions (throwing errors to express)

## Grading checklist at this point

For the submodule assignment, continue forward once:

✅ You’ve characterized the API calls

- **🔘** _I can run all&#xA0;_<!---->_**_e2e tests_**_<!---->_&#xA0;over and over; it works (due to idempotency/randomness using&#xA0;_<!---->_\_**_the builder_**)\_
- **🔘** _I have my E2E tests which verifies the&#xA0;_<!---->_**_success scenario_**_<!---->_&#xA0;for the backend API_
  - _createUser (just one right now)_
- **🔘** _I have characterization tests which verify the&#xA0;_<!---->_**_failure scenarios_**_<!---->_&#xA0;for the backend API using database fixtures to reset the database and adjust the state of the world_

✅ You’ve introduced the new non-implemented Marketing API calls for the two successful marketing calls

- **🔘** _I have represented the new business requirements by introducing an `addEmailToList` marketing API endpoint which gets called (or not called) in the correct scenarios_
  - _Note: A real marketing API implementation (using mailchimp, mailjet, etc — is not mandatory unless you’d like to sign up for a service, but the external service adapter is mandatory)_

✅ You’ve refactored to a 4 tier architecture

- **🔘** _I have refactored my backend API calls to a 4-tier architecture (dtos, service, controller, persistence)_
- **🔘**  _I have a database or userRepo abstraction to encapsulate persistence_
- **🔘** _I have a userService_
- **🔘** _I have a userController_
- **🔘** _I have a postsController_
- **🔘** _I have a postsService_
- **🔘** _I have a marketingController_
- **🔘** _I have a marketingService_
- **🔘** _I have a transactionalEmailAPI injected into the userService_
- **🔘** _I have a contactListAPI used by the marketingService_

## Summary

- If you’re here now, you’ve got the skills to match the challenge.
- To characterize DDDForum, start with the success case, introducing a marketing API call to keep the vertical slices decoupled from each other.
- External services are a part of the 4 tier architecture; services rely upon them. Use a ContactListAPI service (with an optionally empty implementation) to drive the design.
- To handle the ‘AccountAlreadyExists’ and ‘UsernameTaken’ scenarios dealing with table data, you’ll have to design a builder/fixture to construct a collection of data, in addition to the accompanying request objects. You can create the request objects (input/params) and design a collection-oriented builder/fixture to set up the state of the world based based on those.
- Continue forward once you’ve characterized all API calls and refactored to 4 tiers.
