# How to Write Incoming Adapter (Contract) Tests 
#subjectVerification #verticalSlicing

_Last updated: Sept 20th, 2024_

_Topics: application interface, contract testing, incoming adapters, jest, test doubles_

_Major Topics: Test-Driven Development, Behaviour-Driven Design_

Incoming adapter tests help stabilize the contract defined by your API. They make sure that incoming requests route to the correct services/application services. Also sometimes known as “controller tests”, incoming adapter tests are a type of _integration test_ that you can use alongside other tests in your testing strategy.

## Lesson Goals

- What are incoming contract tests and why do they matter?
- How to use an application interface to decouple the incoming
- How to implement incoming contract tests

## What are incoming contract tests and why do they matter?

We've mentioned the **outgoing adapter test**, but there's an **incoming one too**.

Imagine you’re building a GraphQL API or a RESTful API and you have a bunch of different endpoints.

How do you test these? What should you be testing?

Well, you want to ensure that when requests come in, they have the right route params, options, body, headers and so on.

You also want to ensure that requests translate the correct _Service method_ call. You want your API calls to call the right application functionality.

You also want to test that you get errors when you should.

So really, **you’re testing your controller layer**.

Why? Well, what if you have a frontend, a desktop app and a mobile app that relies on your endpoints?

Incoming contract tests help you **avoid breaking clients** and keeps your APIs stable.

## Using an Application Interface to stabilize the API and decouple from incoming infrastructure

To run these sorts of tests, it’s common to design yet another contract — another layer of decoupling at the **front** using something called an _ApplicationInterface._ It’s an interface that acts as a contract describing everything your application core should be able to do.

For example, like this:

```tsx
import { MarketingService } from "../../modules/marketing/marketingService"
import { PostService } from "../../modules/posts/postService"
import { UserService } from "../../modules/users/usersService"

export interface Application {
  user: UserService;
  posts: PostService;
  marketing: MarketingService;
}
```

And now, architecturally, instead of your controller relying directly on services, it relies upon an **application interface**, one that you **compose** and pass into your controller.

Why bother with this? Because now we can play the test double game.

Let’s see what I mean.

## How to implement incoming contract tests

### **1. Write the application interface**

First thing is to represent the application interface. This is the contract through which any incoming infrastructure client (be it a GraphQL server, HTTP server, xyz server) should know **how to** message your core code **when it’s injected**.

```tsx
import { MarketingService } from "../../modules/marketing/marketingService"
import { PostService } from "../../modules/posts/postService"
import { UserService } from "../../modules/users/usersService"

export interface Application {
  user: UserService;
  posts: PostService;
  marketing: MarketingService;
}
```

### **2. Build the application object in the composition root.**

With this change, you’ll have to re-wire the way you compose your application because it starts top down from the interface.

```tsx
import { Application } from "../application/applicationInterface";
import { Config } from "../config";
import { Database } from "../database";
import { WebServer } from "../http";
import {
  UsersModule,
  PostsModule,
  NotificationsModule,
  MarketingModule,
} from "@dddforum/backend/src/modules";

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;

  private webServer: WebServer;
  private dbConnection: Database;
  private config: Config;

  private usersModule: UsersModule;
  private marketingModule: MarketingModule;
  private postsModule: PostsModule;
  private notificationsModule: NotificationsModule;

  public static createCompositionRoot(config: Config) {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new this(config);
    }
    return CompositionRoot.instance;
  }

  private constructor(config: Config) {
    this.config = config;
    this.dbConnection = this.createDBConnection();
    this.notificationsModule = this.createNotificationsModule();
    this.marketingModule = this.createMarketingModule();
    this.usersModule = this.createUsersModule();
    this.postsModule = this.createPostsModule();
    this.webServer = this.createWebServer();
    this.mountRoutes();
  }

  ...

  getApplication(): Application {
    return {
      users: this.usersModule.getUsersService(),
      posts: this.postsModule.getPostsService(),
      marketing: this.marketingModule.getMarketingService(),
    };
  }
  
  ...
}
```

### **3. Adjust the dependency relationship throughout associated objects.**

You’ll likely have to adjust relationships and inject dependencies a little bit differently based on this re-arrangement.

For example, you’ll see differences in:

_building the webserver in composition_

```tsx
createWebServer() {
  const application = this.getApplication();
  return new WebServer({ port: 3000, application });
}
```

_controllers using the application object instead_

```tsx
import express from 'express';
import { Errors } from '../../shared/errors/errors';
import { CreateUserCommand, EditUserCommand, GetUserByEmailQuery } from '@dddforum/shared/src/api/users'
import { Application } from '../../shared/application/applicationInterface'

export class UserController {
  constructor (private application: Application) {
    
  }

  async createUser (req: express.Request, res: express.Response) {
    const command: CreateUserCommand = req.body;
    const result = await this.application.user.createUser(command);
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      switch (result.error) {
        case Errors.EmailAlreadyInUse:
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result)
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result)
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  }

  async editUser (req: express.Request, res: express.Response) {
    const command: EditUserCommand = {
      ...req.body,
      id: Number(req.params.userId)
    };
    const result = await this.application.user.editUser(command);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      switch(result.error) {
        case Errors.EmailAlreadyInUse:
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result)
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result)
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  }

  async getUserByEmail (req: express.Request, res: express.Response)  {
    const query: GetUserByEmailQuery = {
      email: req.query.email as string
    };

    const result = await this.application.user.getUserByEmail(query);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      switch(result.error) {
        case Errors.UserNotFound:
          return res.status(404).json(result)
        case Errors.UsernameAlreadyTaken:
          return res.status(409).json(result)
        case Errors.ValidationError:
        case Errors.ClientError:
          return res.status(400).json(result)
        case Errors.ServerError:
        default:
          return res.status(500).json(result);
      }
    }
  }
}
```

Complete this decoupling on the incoming side.

### 4. Create a new **api registration test**

First step is to set up one more test file.

Here’s where we’ll test the API.

### **5. Wrote the integration test using Jest spies**

For this one, we’ll use Jest to spy on calls to the application.

Allow me to explain this code.

```tsx
import { createAPIClient } from "@dddforum/shared/src/api";
import { UserBuilder } from "@dddforum/shared/tests/support/builders/users";
import { CompositionRoot } from "../../src/shared/compositionRoot";
import { Config } from "../../src/shared/config";

describe("users http API", () => {
  const apiClient = createAPIClient("<http://localhost:3000>");
  const config = new Config("test:infra");

  const composition = CompositionRoot.createCompositionRoot(config);
  const server = composition.getWebServer();

  const application = composition.getApplication();

  let createUserSpy: jest.SpyInstance;

  beforeAll(async () => {
    await server.start();
    createUserSpy = jest.spyOn(application.users, 'createUser');
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
      .withEmail(createUserParams.email)
      .withFirstName(createUserParams.firstName)
      .withLastName(createUserParams.lastName)
      .withUsername(createUserParams.username)
      .build();

      createUserSpy.mockResolvedValue(createUserResponseStub);

    // Act
    // Use the client library to make the api call (pass through as much
    // uncertainty as possible)
    await apiClient.users.register(createUserInput);

    // Communication: Expect it to have called the correct use case
    expect(application.users.createUser).toHaveBeenCalledTimes(1);
  });
});

```

- You’ll run the test in **test:infra** to signify that it’s an integration test
- You’ll create a Jest spy (this is a framework spy, not a hand-written one we’ve used) using `let createUserSpy: jest.SpyInstance`.
- You’ll set up the interception using `createUserSpy = jest.spyOn(application.users, 'createUser');`.
- Then you’ll create a **request object** and you’ll create an **intended response object** that you hope you’ll receive for that call.
- Finally, you’ll set up your mocked createUser to return this intended response object with `createUserSpy.mockResolvedValue(createUserResponseStub);`

Why are we doing this?

Understand that this test is more about confirming that you can **make it through the entirety of the Express** config than anything else.

Sometimes your web server config or RESTful API endpoints aren’t configured correctly, even though your high value unit and outgoing integration tests are perfect.

### **6. Ran all other unit, integration, e2e tests and confirmed that they work**.

We’ve done a lot of stuff here.

Make sure that they all work.

If so… **Congratulations!**

You’ve just completed the hardest part of the course thus far.

## FAQ

### Why do we use _jest_ here?

We’re mocking the entire application itself, really. And over time, that means that every single time we add a new service or change the applicationInterface, if we were to implement this as a **hand-written test double**, we’d _continually_ have to come back and force the hand-written object to conform to the new structure.

This is unnecessary maintenance.

In this scenario, using tools like _jest_ are actually great because we can just specify the portion of the API that we’d like to inspect or have behave a certain way, and we can do that from the test

### What type of verification is this?

This is certainly _Communication Verification_.

## Your Turn!

**Grading Checklist**

- 🔘 _I have decoupled from the incoming controller using an applicationInterface_

_For my Users API, for any of the API calls:_

- 🔘 _has at least one success case & one failure case_

_For my Marketing API, for any of the API calls:_

- 🔘 _has at least one success case & one failure case_

_For both, all contract (incoming) tests:_

- 🔘 _I have verified that API calls the correct application use cases (services’ methods) using jest mocks_ </aside>

## Summary

- High value incoming adapter tests are tests that help you stabilize your incoming APIs
- Acting as a layer of protection against breaking API clients, they enable you to verify, validate, and stabilize the _shape_ of the responses, success and failures.
- They also help you ensure your requests get directed to the correct application layer use cases (service methods).
- To do it.. we primarily use stubs and framework-based spies because they tend to be more maintainable than hand-written test doubles.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.