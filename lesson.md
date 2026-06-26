# 💥 Action: Assignment Submission - Advanced Testing Best Practices

_Last updated: July 7th, 2024_

_Estimated time to complete: 3 hours_

## Context

Recall that our goal here is to gain enough experience with all of the most important types of tests.

We’ve practiced E2e on both sides of the stack and in this assignment, we’ll practice the more advanced ones, which will require us to carve out a hexagonal architecture.

## What you’ll practice

> _Practice writing high value unit, integration, incoming & outgoing tests after decoupling from infrastructure code using the hexagonal architecture. This will complete exploration of the most important types of tests & how to write them._

## Pre-requisites

- ✨ How to handle edge cases using fixtures & builders
- ✨ How to use an abstract factory pattern to encapsulate the creation of similar builders
- ✨ How & why to use contracts, design patterns & dependency inversion to refactor your API to a Hexagonal (Ports & Adapters) architecture
- ✨ How to use the Composition Root pattern to make your application dependencies dynamic, polymorphic, configurable and simplify test setup
- ✨ How to mock, stub, spy & use the same E2E acceptance test suite to write High Value Unit & Integration Tests on either side of the stack
- ✨ How to use tables to harden your test suite with hundreds of concrete examples
- ✨  How to write incoming & outgoing contract tests

## Requirements

### Decoupling core code from infrastructure code to create a hexagonal architecture

You knew this was coming.

You’re going to decouple your core code from infrastructure code using contracts.

In the land of _hexagonal architecture_, we call the interface — the contract — the _port;_ and we call the implementation _the adapter_.

This means:

- your database (or repositories if you’ve used this pattern)
- your transactionAPI,
- your contactListAPI

— all these, they’re **outgoing adapters**.

We’ll need to use contracts to decouple these from core code.

On the other side, where your controller calls your services — this is also a case of infra code (controllers) touching core code (services).

You’ll use what’s called an _applicationInterface_ to decouple core from infra.

Both forms of decoupling will help in terms of writing different types of tests.

### Outgoing adapter contract tests

The first type of test we’ll start with is the outgoing adapter test

This type of test enables us to verify if we’re to talkingt o the database, the external services, anything external to our application — correctly

For this assignment, you’ll only be focused on the database (or repos), but if you chose to implement a real contactListPAI and a real transactionsEmailAPI, then you’ll be testing these as well.

### High value unit tests

Once you decouple from the outgoing adapters, you gain the ability to write high value unit tests.

These are tests which start from the service and **end** at the service, exercising the EXACT SAME acceptance test, but from a different scope.

Instead of executing at the E2E scope, they execute against the **core code — the innermost application & business logic** for a feature**.**

### Using polymorphism to swap between test doubles & production code depending on the context

Wait… services rely upon databases and external services… how will we handle this?

Using test doubles.

We’ll learn to build test doubles and how to swap dependencies at runtime depending on the context.

We’ll see how you can do this with either hand-written mocks, Jest or some other testing library’s mocking utility.

### Handling edge cases by controlling and verifying indirect inputs & outputs

Here’s where **systems thinking** really shines.

Once you completely decouple a core code feature (a service), it’s nothing more than inputs and outputs.

That’s not hard to see.

But what’s not commonly understood is the concept of **indirect inputs & indirect outputs**.

Depending on the state of the services’ dependencies (the database state, the external service state), you can expect different behaviour — different edge cases.

If the user was already created, we’ll get different behaviour from if it wasn’t.

That makes a database an **indirect input & output**.

We’ll make use of _Communication Verification **— this is the final of the 3 types of subject verification**._ It’ll give us the ability to determine and detect if we’ve called an **indirect output** when we should have (or if we should not have) depending on the scenario.

We’ll use test doubles to handle these indirect inputs & outputs.

### Test parity

To keep our test code & production code in sync, we’ll need to use contract tests.

This is one of the most powerful testing techniques I know of.

### High value integration tests

Shockingly similar to high value unit tests, you’ll see how you can basically copy/clone the exact same test, change the test scope, and gain way more confidence, in just a few lines of code.

That’s the power of polymorphism.

### Incoming adapter contract tests

The last sort of test we’ll explore is the incoming contract test.

If you’ve got multiple different types of clients (like a desktop app, web app, mobile app) that all talk to the backend, you want to make sure that the communication doesn’t break down. You want to make sure that the API client works, and that it always returns the data you expect and calls the right use cases depending on the specifics and nuances of your clients.

Just like how an outgoing test creates parity between test doubles and production code, the incoming test ensures your clients conform to the API and allows you to rest safely knowing your frontend or client code can rely on the API.

## Steps: How to complete this exercise

### **Step 1. Set up your project**

1. (If you haven't already) [clone the template to your GitHub and download it to your machine](https://github.com/stemmlerjs/the-software-essentialist)
2. Go to the project folder for this assignment (head [here](https://github.com/stemmlerjs/the-software-essentialist/tree/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart1/exercises/1_RefactoringTo4Tiers) to see it on GitHub).
3. npm install
4. Set up your terminals (one for running tests, one for committing)
5. Create a new branch (ex: _advancedTest_) using `git checkout -b <branchName>`
6. Get started in the _start_ folder

### Step 2: Decoupling (Outgoing) → Refactoring to outgoing ports & adapters (repos)

Remember that the entire reason we decouple is so that we can write tests.

Therefore, let’s focus on the **outgoing ports** first.

At the moment, your database connection code could be pretty messy or unorganized.

For reference, we currently have something like this:

_database.ts_

```
import { PrismaClient } from "@prisma/client";
import { generateRandomPassword } from "../utils";

export interface UsersPersistence {
  save(user: NewUser): any;
  findUserByEmail(email: string): any;
  findUserByUsername(username: string): any;
}

export class Database {
  public users: UsersPersistence;
  private connection: PrismaClient;

  constructor() {
    this.connection = new PrismaClient();
    this.users = this.buildUsersPersistence();
  }

  getConnection() {
    return this.connection;
  }

  async connect() {
    await this.connection.$connect();
  }

  private buildUsersPersistence(): UsersPersistence {
    return {
      save: this.saveUser.bind(this),
      findUserByEmail: this.findUserByEmail.bind(this),
      findUserByUsername: this.findUserByUsername.bind(this),
    };
  }

  private async saveUser(user: any) {
    const { email, firstName, lastName, username } = user;
    return await this.connection.$transaction(async () => {
      const user = await this.connection.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          password: generateRandomPassword(10),
        },
      });
      
      const member = await this.connection.member.create({
        data: { userId: user.id },
      });
      return { user, member };
    });
  }

  private async findUserByEmail(email: string) {
    return this.connection.user.findFirst({ where: { email } });
  }

  private async findUserByUsername(username: string) {
    return this.connection.user.findFirst({ where: { username } });
  }
}

```

What’s the goal?

We want to separate code out into _ports & adapters_, concretions and implementations.

Take a look at the following structure.

This is what you’re moving towards.

The best thing to do is to start with the **ports (the interfaces)**.

That means I would first clarify the _userRepo_ and _postRepo_ interfaces.

When you do this, make sure you _document_ all the associated types (dtos, input responses, output responses) as strictly as you can. You’re completely inverting the dependency relationship here.

_shared/database/database.ts_

```tsx
import { UserRepo } from "../../modules/users/userRepo";
import { PostRepo } from "../../modules/posts/postRepo";

export interface Database {
  users: UserRepo;
  posts: PostRepo;
}
```

_users/usersRepo.ts_

```tsx
import { ValidatedUser } from "@dddforum/shared/src/api/users";
import { User } from "@prisma/client";

export interface UsersRepository {
  findUserByEmail(email: string): Promise<User | null>;
  save(user: ValidatedUser): Promise<User>;
  findById(id: number): Promise<User | null>;
  delete(email: string): Promise<void>;
  findUserByUsername(username: string): Promise<User | null>;
  update(id: number, props: Partial<ValidatedUser>): Promise<User | null>;
}
```

This sets us up to write the first set of outgoing contract tests for the user repo.

When you do this, you’ll notice that some things might have to change. Some code might be off, some types might not quite work. That’s good and that’s normal. Every time we write a test, we’re working from the outside-in, and we’re forcing our code to converge to what we say it must be. Good. Make the changes to the code which will support your test

One of such changes is the addition of the **abstract factory pattern** in terms of creating the correct builder for the job.

```tsx
import { PrismaClient } from "@prisma/client";
import { ProductionUserRepository } from "../adapters/productionUserRepository";
import { UserBuilder } from '@dddforum/shared/tests/support/builders/users'
import { UsersRepository } from "./usersRepository";

describe("userRepo", () => {
  let userRepos: UsersRepository[] = [
    new ProductionUserRepository(new PrismaClient()),
  ];

  it("can save and retrieve users by email", () => {
    let createUserInput = new UserBuilder()
      .makeValidatedUserBuilder()
      .withAllRandomDetails()
      .build()

    userRepos.forEach(async (userRepo) => {
      let savedUserResult = await userRepo.save({
        ...createUserInput,
        password: '',
      });
      let fetchedUserResult = await userRepo.findUserByEmail(
        createUserInput.email,
      );

      expect(savedUserResult).toBeDefined();
      expect(fetchedUserResult).toBeDefined();
      expect(savedUserResult.email).toEqual(fetchedUserResult?.email);
    });
  });

  it("can find a user by username", () => {
    let createUserInput = new UserBuilder()
      .makeValidatedUserBuilder()
      .withAllRandomDetails()
      .build();

    userRepos.forEach(async (userRepo) => {
      let savedUserResult = await userRepo.save({
        ...createUserInput,
        password: "",
      });
      let fetchedUserResult = await userRepo.findUserByUsername(
        createUserInput.username,
      );

      expect(savedUserResult).toBeDefined();
      expect(fetchedUserResult).toBeDefined();
      expect(savedUserResult.username).toEqual(fetchedUserResult?.username);
    });
  });
});

```

Nice! And now let’s not forget to adjust the service code, which may have relied upon a database object. Invert the dependency relationship by getting your `UserService` to reply upon _interfaces_ instead of _concretions_.

```tsx
export class UsersService {
  constructor(
    private repository: UsersRepository, // This should be done
    private emailAPI: TransactionalEmailAPI, // This is next
  ) {}

  async createUser(userData: CreateUserCommand) {
    const existingUserByEmail = await this.repository.findUserByEmail(
      userData.email,
    );
    if (existingUserByEmail) {
      throw new EmailAlreadyInUseException(userData.email);
    }

    const existingUserByUsername = await this.repository.findUserByUsername(
      userData.username,
    );
    if (existingUserByUsername) {
      throw new UsernameAlreadyTakenException(userData.username);
    }
    
    const validatedUser: ValidatedUser = {
      ...userData.props,
      password: TextUtil.createRandomText(10)
    }
    
    const prismaUser = await this.repository.save(validatedUser);

    await this.emailAPI.sendMail({
      to: validatedUser.email,
      subject: "Your login details to DDDForum",
      text: `Welcome to DDDForum. You can login with the following details </br>
      email: ${validatedUser.email}
      password: ${validatedUser.password}`,
    });

    return prismaUser;
  }
```

### **Step 3**: Decoupling (Outgoing) → Decoupling the notifications & marketing APIs from core code

You saw this in the previous step, but since we’re working to decouple all outgoing _services_ and _database connections_ (basically, all of the infrastructure dependencies) from core code, let’s decouple the external adapters as well.

Yet again, we do this by introducing a **port** through which an **adapter** can implement.

And here’s how we’ll do it.

Previously, you may have implemented these with empty implementations… which I said you’re OK to do in case you don’t want to _have to_ register for email services. This is just a course we’re taking here, after all. But, yeah - if you wanted to get the real experience. Register, hook it up.

But for the majority of students, I expect, this is what the contact list API might look like first time around.

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

Well now, we actually want to be explicit about the difference between a **production** and a **testing/development** implementation.

So again. Polymorphism.

Set up your **port**.

```tsx
export interface ContactListAPI {
  addEmailToList(email: string): Promise<boolean>;
}
```

Set up your **production instance** (which you’re free to not actually implement).

```tsx
import { ContactListAPI } from "../../ports/contactListAPI";

export class MailchimpContactList implements ContactListAPI {
  async addEmailToList(email: string): Promise<boolean> {
    // Do the actual work
    console.log(
      `MailchimpContactList: Adding ${email} list... for production usage.`,
    );
    return true;
  }
}
```

And shortly, we’ll set up the **test instances** (as shown by the _contactListSpy_).

So far so good.

Do this same thing for your **notifications module**, adjusting any code in the composition root, your services, and anything else where change ripples.

By the end of this, you will have fully decoupled from outgoing infrastructure. Great work!

### **Step 4: High Value Unit** → Express the expressive high value unit tests & adjust your module composition to provide fake implementations

We are now poised to write our high value unit tests.

Here’s where it gets interesting.

You’re going to use fake implementations of your outgoing infrastructure to keep your core code pure.

**4.1. Set up your high value unit test**. In `registration.unit.ts`, set up a new, empty executable specification based on the gherkins acceptance test.

**4.2 Write the test executable specification w/ a new context config.** Use arrange-act-assert backwards to specify your test.

```tsx
...

beforeAll(async () => {
  composition = CompositionRoot.createCompositionRoot(new Config('test:unit'));
  fakeUserRepo = composition.getRepositories().users as InMemoryUserRepository;
})

afterEach(async () => {
  await fakeUserRepo.reset();
});

test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  given('I am a new user', async () => {
    createUserCommand = new UserBuilder()
      .makeCreateUserCommandBuilder()
      .withAllRandomDetails()
      .withFirstName('Khalil')
      .withLastName('Stemmler')
      .buildCommand();
  });

  when('I register with valid account details accepting marketing emails', async () => {
    createUserResponse = await application.users.createUser(createUserCommand);
    addEmailToListResponse = await application.marketing.addEmailToList(createUserCommand.email);
  });

  then('I should be granted access to my account', async () => {
    expect(createUserResponse.id).toBeDefined();
    expect(createUserResponse.email).toEqual(createUserCommand.email);
    expect(createUserResponse.firstName).toEqual(createUserCommand.firstName);
    expect(createUserResponse.lastName).toEqual(createUserCommand.lastName);
    expect(createUserResponse.username).toEqual(createUserCommand.username);
    
    // And the user exists (State Verification)
    const getUserResponse = await application.users.getUserByEmail(createUserCommand.email);
    expect(createUserCommand.email).toEqual(getUserResponse.email);
  })

  and('I should expect to receive marketing emails', () => {
    // Todo
  });
})
```

Obviously, lots of stuff here won’t compile, but that’s okay for now.

Pay close attention to the `Config` object we’ve invented.

To use different implementations, we’ll switch on the _config_.

In your `beforeAll`, notice the use of the `test:unit` config.

```tsx
composition = CompositionRoot.createCompositionRoot(new Config('test:unit'));
```

Take specific note of the config object.

_shared/config/index.ts_

```tsx
export type Environment = "development" | "production" | "staging" | "ci";

export type Script =
  | "test:unit"
  | "test:e2e"
  | "start:dev"
  | "start:prod"
  | "test:infra";

export class Config {
  env: Environment;
  script: Script;

  constructor(script: Script) {
    this.env = (process.env.NODE_ENV as Environment) || "development";
    this.script = script;
  }

  getEnvironment() {
    return this.env;
  }

  getScript() {
    return this.script;
  }
}
```

**4.3 Change the composition root to make it use a new one based on the context.**

Now, within your composition root, you’re going to create a different implementation based on it.

Somewhere, you’ll want to introduce a method like so:

_usersModule_

```tsx
shouldBuildFakeRepository() {
  return (
    this.getScript() === "test:unit" ||
    this.getEnvironment() === "development"
  );
}
```

That way, when we build our `usersModule`, we create the correct one.

```tsx
export class UsersModule {
  private usersService: UsersService;
  private usersController: UsersController;
  private usersRepository: UsersRepository;

  private constructor(
    private db: Database,
    private emailAPI: TransactionalEmailAPI,
    config: Config,
  ) {
    super(config);
    this.usersRepository = this.createUsersRepository();
    this.usersService = this.createUsersService();
    this.usersController = this.createUsersController();
  }

  static build(db: Database, emailAPI: TransactionalEmailAPI, config: Config) {
    return new UsersModule(db, emailAPI, config);
  }

  private createUsersRepository() {
    if (this.usersRepository) return this.usersRepository;
    if (this.shouldBuildFakeRepository) {
      return new InMemoryUserRepository();
    }

    return new ProductionUserRepository(this.db.getConnection());
  }
}
```

We’ve just invented the concept of an `InMemoryUserRepository`.

Now, let’s build it.

**4.4 Write the fake implementation of the user repo.**

You’ll have to build a userRepo that adheres to the user repository interface. Set that up now.

```tsx
import { ValidatedUser } from "@dddforum/shared/src/api/users";
import { UsersRepository } from "../ports/usersRepository";
import { CreateUserCommand } from "../usersCommand";
import { User } from "@prisma/client";

export class InMemoryUserRepository implements UsersRepository
{
  private users: User[];

  constructor() {
    super();
    this.users = [];
  }

  save(user: ValidatedUser): Promise<User> {
    const newUser = {
      ...user,
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      password: '',
    };
    this.users.push(newUser);
    return Promise.resolve({ ...newUser, password: "password" });
  }

  findById(id: number): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) || null);
  }

  delete(email: string): Promise<void> {
    const index = this.users.findIndex((user) => user.email === email);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
    return Promise.resolve();
  }

  async update(
    id: number,
    props: Partial<CreateUserCommand>,
  ): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...props };
      return Promise.resolve(this.users[userIndex]);
    }

    return Promise.resolve(null);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.email === email) || null,
    );
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.username === username) || null,
    );
  }

  async reset() {
    this.users = [];
  }
}

```

**4.5 Watch the test pass & do this for all of the tests.**

Now make everything that doesn’t compile, compile, jostling what needs to get jostled until your tests pass. This should be fairly minimal.

### Step 5: High Value Unit → Turn your user repo into a spy for communication verification

**5.1 Write the communication verification statement.** The beauty of using these fake implementations is that we can also perform communication verification to verify that they were in fact, called.

Let’s again start from the test and add a communication verification statement like so.

```tsx
then('I should be granted access to my account', async () => {
  expect(createUserResponse.id).toBeDefined();
  expect(createUserResponse.email).toEqual(createUserCommand.email);
  expect(createUserResponse.firstName).toEqual(createUserCommand.firstName);
  expect(createUserResponse.lastName).toEqual(createUserCommand.lastName);
  expect(createUserResponse.username).toEqual(createUserCommand.username);
  
  // And the user exists (State Verification)
  const getUserResponse = await application.users.getUserByEmail(createUserCommand.email);
  expect(createUserCommand.email).toEqual(getUserResponse.email);

	// New! (communication verification)
  expect(fakeUserRepo.getTimesMethodCalled('save')).toEqual(1);
})
```

**5.2 Turn your user repo into a spy, give it spy functionality & make the test pass.**

First I’m going to show you the adjusted _InMemoryUserRepo_ which is now called `InMemoryUserRepositorySpy` and then I’ll show you the **spy** base class.

Here’s the `InMemoryUserRepoSpy`.

```tsx
import { ValidatedUser } from "@dddforum/shared/src/api/users";
import { Spy } from "../../../shared/testDoubles/spy";
import { UsersRepository } from "../ports/usersRepository";
import { CreateUserCommand } from "../usersCommand";
import { User } from "@prisma/client";

export class InMemoryUserRepositorySpy extends Spy<UsersRepository>
  implements UsersRepository
{
  private users: User[];

  constructor() {
    super();
    this.users = [];
  }

  save(user: ValidatedUser): Promise<User> {
    this.addCall("save", [user]);
    const newUser = {
      ...user,
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      password: '',
    };
    this.users.push(newUser);
    return Promise.resolve({ ...newUser, password: "password" });
  }
  
  ...

  async reset() {
    this.calls = [];
    this.users = [];
  }
}
```

When I first wrote this, I put everything you’re about to see in the next step, in this single file, which is actually _correct_, because we want to refactor we see duplication x3, remember?

But over the next few steps, you’ll see why I’ve chosen to move the complexity down a layer.

**5.3 Abstract the spy functionality**. Here’s the actual spy functionality.

Remember that the `protected` scope means a method is only accessible via a subclass.

And there’s some funky polymorphism stuff we’re doing with keys, types, generics and so on. You can refer back the lessons on these.

```tsx
type ValidMethodNames<T> = keyof T;

interface Call<T> {
  methodName: ValidMethodNames<T>;
  args: any[];
  context: any; // Additional contextual details about the call
}

export abstract class Spy<T> {
  protected calls: Call<T>[];

  constructor() {
    this.calls = [];
  }

  protected addCall<MethodName extends ValidMethodNames<T>>(
    methodName: MethodName,
    args: any[],
    context?: any,
  ) {
    const call: Call<T> = {
      methodName,
      args,
      context,
    };
    this.calls.push(call);
  }

  getCalls(): Call<T>[] {
    return this.calls;
  }

  getTimesMethodCalled<MethodName extends ValidMethodNames<T>>(
    methodName: MethodName,
  ) {
    const calls = this.calls.filter((call) => call.methodName === methodName);
    return calls.length;
  }

  reset() {
    this.calls = [];
  }
}

```

Make sure your tests pass before moving on.

Make sure that you get a _save_ when you expect a save, and that you _don’t_ get a save when you don’t expect one.

With this written once, we now have a valuable piece of testing infrastructure through which we can turn any of our test doubles into spies.

And that’s what we’ll do in the next steps.

### Step 6: High Value Unit → Turn your marketing and notifications implementations into spies for communication verification

**6.1 Write the communication verification statements for your marketing and notifications API calls.**

Now let’s think about the other two infrastructure adapters — the _transactionalEmailAPI_ and the _contactListAPI_. How should they behave?

In a successful registration, it’s clear we that the three command-like operations we perform against external infrastructure are:

1. _**save to database (done already)**_
2. _**send an email verification**_
3. _**add the user to a contact list when the marketing option is selected**_

```tsx
// I expect the user repo to save the user to the database
expect(userRepoSpy.getTimesMethodCalled('save')).toEqual(1);

// I expect the transactional api to attempt to send mail
expect(transactionalEmailAPISpy.getTimesMethodCalled('sendMail')).toEqual(1);

// I expect the contact list api to attempt to add an email to the list
expect(contactListAPISpy.getTimesMethodCalled('addEmailToList')).toEqual(1);
```

But again, we’re not going to call _real versions_ of the infrastructure adapters, so let’s write the communication verification statements.

Here’s the updated success case..

```tsx
test('Successful registration with marketing emails accepted', ({ given, when, then, and }) => {
  given('I am a new user', async () => {
    createUserCommand = new UserBuilder()
      .makeCreateUserCommandBuilder()
      .withAllRandomDetails()
      .withFirstName('Khalil')
      .withLastName('Stemmler')
      .buildCommand();
  });

  when('I register with valid account details accepting marketing emails', async () => {
    createUserResponse = await application.users.createUser(createUserCommand);
    addEmailToListResponse = await application.marketing.addEmailToList(createUserCommand.email);
  });

  then('I should be granted access to my account', async () => {
    expect(createUserResponse.id).toBeDefined();
    expect(createUserResponse.email).toEqual(createUserCommand.email);
    expect(createUserResponse.firstName).toEqual(createUserCommand.firstName);
    expect(createUserResponse.lastName).toEqual(createUserCommand.lastName);
    expect(createUserResponse.username).toEqual(createUserCommand.username);
    
    // And the user exists (State Verification)
    const getUserResponse = await application.users.getUserByEmail(createUserCommand.email);
    expect(createUserCommand.email).toEqual(getUserResponse.email);

    expect(userRepoSpy.getTimesMethodCalled('save')).toEqual(1);

    // Verify that an email has been sent (Communication Verification)
    expect(transactionalEmailAPISpy.getTimesMethodCalled('sendMail')).toEqual(1);
  })

  and('I should expect to receive marketing emails', () => {
    expect(addEmailToListResponse).toBeTruthy();
    expect(contactListAPISpy.getTimesMethodCalled('addEmailToList')).toEqual(1);
  });
})
```

**6.2 Create alternate versions of these as well for testing.**

Go ahead now and repeat the same process, creating fake versions of both the contactListAPI and the transactionalEmailAPI.

**6.3 Adjust your composition root to handle these new ones.**

And just as well, go ahead and adjust the composition root the same way we did it with the userRepo as well.

**6.4 Turn the external service adapters into spies as well.** And just as well, turn them both into spies.

For example, the transactionalEmailAPISpy is pretty straightforward.

```tsx
import { Spy } from "../../../../shared/testDoubles/spy";
import {
  SendMailInput,
  TransactionalEmailAPI,
} from "../../ports/transactionalEmailAPI";

export class TransactionalEmailAPISpy
  extends Spy<TransactionalEmailAPI>
  implements TransactionalEmailAPI
{
  constructor() {
    super();
  }

  async sendMail(input: SendMailInput): Promise<boolean> {
    this.addCall("sendMail", [input]);
    return true;
  }
}
```

**6.5 Make all your tests pass, adding these additional spies where necessary.**

Do this for all of your tests where necessary.

### Step 7: Contract (Outgoing) → Contract test all your userRepo implementations

Test-production-code parity is really important. If we use test doubles locally, how will we know if they’ll also work in production?

Let’s fix that now.

**7.1 Add the other user repo to your contract test.**

You only have to change one line:

```tsx
describe("userRepo", () => {
  let userRepos: UsersRepository[] = [
    new ProductionUserRepository(new PrismaClient()),
    new InMemoryUserRepositorySpy()
  ];
  ...
})
```

That’s it.

Now run the test again.

**7.2 Confirm it works, fix it if it doesn’t — you now have production-test-code parity.**

Recall that this is the dynamic we’re working with.

So long as both of your tests (high value unit + contract) work, you can rest easy that your test doubles are not robbing you of the confidence you need in your codebase.

### Step 8: **High Value Integration** → Duplicate & adjust your High Value Unit to High Value Integration

Now let’s write the high value integration test version of the same test.

**8.1 Copy your unit test to registration.infra.ts.**

Self explanatory step, but you can basically just copy your registration.unit.ts to a `registration.infra.ts` file.

```
- features
  - registration
    - registration.e2e.ts
    - registration.infra.ts
    - registration.unit.ts
```

**8.2 Change the context of the test in the composition root config.**

What’s different?

Very little.

However, this little line here is important:

```tsx
composition = CompositionRoot.createCompositionRoot(new Config('test:infra'));
```

Consider how this might change your application composition at runtime.

Here’s what you want:

- _use the real user repo_
- _use the real transaction api_
- _use the real marketing / contact list api_

Add the correct code in your corresponding modules to make it so.

**8.3 Remove communication verification statements, confirming using real user repo and real services interactions.**

Remove the communication verification statements anymore because we’re making real calls to infrastructure.

And if you want to confirm that you’re at the very least _calling_ the right methods, well — that’s what the high value unit tests are for.

The integration tests are for confirming it all actually talks to each other.

Make sure all your tests pass.

### Step 9: **Decoupling (Incoming) → Decoupling to an Application Interface**

We’re nearly done.

It’s time to take a look at the incoming side of the architecture now.

**9.1 Wrote application interface.** First thing is to represent the application interface. This is the contract through which any incoming infrastructure client (be it a GraphQL server, HTTP server, xyz server) should know **how to** message your core code **when it’s injected**.

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

**9.2 Build the object in the composition root.** With this change, you’ll have to re-wire the way you compose your application because it starts top down from the interface.

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

  createNotificationsModule() {
    return NotificationsModule.build(this.config);
  }

  createMarketingModule() {
    return MarketingModule.build(this.config);
  }

  createUsersModule() {
    return UsersModule.build(
      this.dbConnection,
      this.notificationsModule.getTransactionalEmailAPI(),
      this.config,
    );
  }

  createPostsModule() {
    return PostsModule.build(this.dbConnection, this.config);
  }

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

**9.3 Adjust the dependency relationship throughout associated objects.**

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

### Step 10: Contract (Incoming) → Contract test your API using Jest mocks

Finally, let’s write the incoming contract tests.

These tests are meant to verify your apiClients, and to make sure that requests, regardless of the protocol (RESTful, GraphQL, etc) point to the correct application use cases / services, and get called with the correct arguments.

**10.1 created api registration test file with infra**. First step is to set up one more test file.

```
- tests
  - api
    - registration.api.infra.ts
```

**10.2 Wrote the integration test using Jest to spy on whichever use case you want to test at a time.**

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
    const createUserParams = new UserBuilder()
      .makeCreateUserCommandBuilder()
      .withAllRandomDetails()
      .withFirstName("Khalil")
      .withLastName("Stemmler")
      .build();

    const createUserResponseStub = new UserBuilder()
      .makeValidatedUserBuilder()
      .withEmail(createUserParams.email)
      .withFirstName(createUserParams.firstName)
      .withLastName(createUserParams.lastName)
      .withUsername(createUserParams.username)
      .build();

      createUserSpy.mockResolvedValue(createUserResponseStub);

    // Act
    // Use the client library to make the api call (pass through as much
    // uncertainty as possible)
    await apiClient.users.register(createUserParams);

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

**10.4 Ran all other unit, integration, e2e tests and confirmed that they work**.

We’ve done a lot of stuff here.

Make sure that they all work.

If so… **Congratulations!**

You’ve just completed the hardest part of the course thus far.

## **How to know when you’re finished**

Use the following grading checklist to self-evaluate (and evaluate others' assignment submissions) to see the assignment has been done correctly.

### **Grading Checklist**

_**Horizontal Architecture & Decoupling to Ports & Adapters**_

- 🔘 _I have decoupled my database from my application using repositories_
- 🔘 _I have decoupled from external services using wrappers/service facades_
- 🔘 _I have decoupled from the incoming controller using an applicationInterface_

_**Outgoing Contract Tests**_

_For my UserRepo contract test, both the production and test implementations of a UserRepo have the following:_

- 🔘 _can successfully ‘save’ & retrieve and item_
- 🔘 _can ‘getAllUsers’ has at least one success & one failure case_
- 🔘 _can ‘getByEmail’ has at least one success & one failure case_
- 🔘 _can ‘getByUsername’ has at least one success & one failure case_

_**High Value Unit & Integration Tests**_

- 🔘 _All of my backend unit, integration & e2e tests use the following acceptance test_
    
    ```gherkin
    Feature: Registration
    	As a new user,
    	I want to register as a Member
    	So that I can vote on posts, ask questions, and earn points for discounts.
    
    	# Success scenarios
    	@backend @frontend
    	Scenario: Successful registration with marketing emails accepted
    		Given I am a new user
    		When I register with valid account details accepting marketing emails
    		Then I should be granted access to my account
    		And I should expect to receive marketing emails
    
    	@backend
    	Scenario: Successful registration without marketing emails accepted
    		Given I am a new user
    		When I register with valid account details declining marketing emails
    		Then I should be granted access to my account
    		And I should not expect to receive marketing emails
    
    	# Failure scenarios
    	@backend
    	Scenario: Invalid or missing registration details
    		Given I am a new user
    		When I register with invalid account details
    		Then I should see an error notifying me that my input is invalid
    		And I should not have been sent access to account details
    
    	@backend
    	Scenario: Account already created w/ email
    		Given a set of users already created accounts
    			| firstName | lastName | email             |
    			| John      | Doe      | john@example.com  |
    			| Alice     | Smith    | alice@example.com |
    			| David     | Brown    | david@example.com |
    		When new users attempt to register with those emails
    		Then they should see an error notifying them that the account already exists
    		And they should not have been sent access to account details
    
    	@backend
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
    
    - 🔘 _All of my backend unit, integration & e2e tests pass_
    - 🔘 _I have ensured all tests are idempotent_
    - 🔘 _High value unit tests run extremely fast with no coupling to infrastructure_
    - 🔘 _High value integration tests make use of a **real** production repository (though unimplemented marketingAPI and transactionalEmailAPIs are okay)_

_**Using Test Doubles & Communication Verification**_

- 🔘 _I have used communication verification to verify that the **indirect outputs** have been called_
    - _userRepo’s ‘”save” gets called when appropriate_
    - _transactionalEmailAPI’s “sendEmail” gets called when appropriate_
    - _marketingAPI’s “addToContactList” gets called when appropriate_

_**Incoming Contract Tests**_

_For my Users API, for any of the API calls:_

- 🔘 _has at least one success case & one failure case_

_For my Marketing API, for any of the API calls:_

- 🔘 _has at least one success case & one failure case_

_For both, all contract (incoming) tests:_

- 🔘 _I have verified that API calls the correct application use cases (services’ methods) using jest mocks_ </aside>