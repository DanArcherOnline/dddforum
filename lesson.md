# How to Write High Value Unit Tests

\#subjectVerification #verticalSlicing

_Last updated: Sept 20th, 2024_

_Topics: composition, test doubles (fakes, mocks, stubs), core code vs. infra code, 4 tiers architecture, hexagonal architecture_

_Major Topics: Test-Driven Development, Behaviour-Driven Design, Architectural Patterns, Design Patterns_

Now that we’ve decoupled the outgoing adapters from our core code, we’re finally ready to learn how to write high value unit tests.

Let’s go deeper on these, learn why we write them, and how to write them.

## Lesson Goals

Specifically, we will over:

- _what is a high value unit test & why does it matter?_
- _what is the architecture of a high value unit test?_
- _how to write high value unit tests_

## What is a high value unit test & why does it matter?

By now, you know that there are three different ways we can write _High Value Acceptance Tests_.

- _high value unit_
- _high value integration_
- _high value e2e_

The high value unit test is the version which we execute against the core code — the **application & domain layers** of our system.

Because we run them against core code, they are super fast and isolated.

### What might be the reason we want to run these?

Ultimately, all of this horizontal decoupling exists so that we can **test our application at different scopes**. It’s very much about _focus_ and specificity.

Here are a few reasons.

1. **When the application & domain logic is extremely complicated and we don’t get enough control at the higher levels**. When you’re running E2E tests, there are certain things that are either impossible to test, or just too clunky to test. This becomes especially true once we get into _Domain-Driven Design_. Think about creating a _Discord_ _Pomodoro Bot_. Imagine one of the features enabled everyone to chime in with what they were going to do in the next pomodoro. Imagine it allowed each user to break their work into _projects_ and _tasks_ and it kept track of all of that. A lot of statefulness. Your High Value Unit Tests operate at the scope of the application and domain logic, which enables you to inspect the objects that’ll get saved at a lower-level. You can check the relationships and side-effects easily.
2. **Focus**. Being able to focus on _just the application and domain logic without worrying about&#xA0;_<!---->_**_persistence_**_, is a sort of psychological chunking technique._ We all know how scatterbrained we can get. Sometimes it’s a necessity because we push upon human limits. These tests enable you to break the problem down into smaller pieces to focus your energy more intently.
3. **Faster feedback in your CI than E2e tests**. You can load these up as the first layer of your Deployment Pipeline!
4. **Cost (more control over indirect inputs & outputs)**. Imagine you needed to integrate with a payments system. Well, there are a million different things that could happen here. Payments could succeed. They could fail. They could fail because the card is invalid. They could fail because of insufficient credits. Perhaps the card is an at risk card. There’s so much. Now, if you _don’t_ have access to a _sandbox_ environment for the payment system’s API, then you’re going to need to run tests against the real deal. But that might cost you money. Maybe you don’t want to be re-running tests over and over every few seconds running up the bill. A better option is use _Test Doubles_ (fake implementations) to test all those different scenarios and make sure _YOUR_ code behaves how it should if the indirect input/output (payment system API) misbehaves.

Just to name a few!

## Writing high value unit tests

### 1. Setting up your high value test

By now, we should have already decoupled from the outgoing adapters.

In `registration.unit.ts`, set up a new, empty executable specification based on the gherkins acceptance test.

### **2. Write the executable specification, setting the “test:unit” context/script**

Use arrange-act-assert backwards to specify your test.

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
    createUserInput = new UserBuilder()
      .makeCreateUserInputBuilder()
      .withAllRandomDetails()
      .withFirstName('Khalil')
      .withLastName('Stemmler')
      .buildCommand();
  });

  when('I register with valid account details accepting marketing emails', async () => {
    createUserResponse = await application.users.createUser(createUserInput);
    addEmailToListResponse = await application.marketing.addEmailToList(createUserInput.email);
  });

  then('I should be granted access to my account', async () => {
    expect(createUserResponse.id).toBeDefined();
    expect(createUserResponse.email).toEqual(createUserInput.email);
    expect(createUserResponse.firstName).toEqual(createUserInput.firstName);
    expect(createUserResponse.lastName).toEqual(createUserInput.lastName);
    expect(createUserResponse.username).toEqual(createUserInput.username);
    
    // And the user exists (State Verification)
    const getUserResponse = await application.users.getUserByEmail(createUserInput.email);
    expect(createUserInput.email).toEqual(getUserResponse.email);
  })

  and('I should expect to receive marketing emails', () => {
    // Todo
  });
})
```

Obviously, lots of stuff here won’t compile, but that’s okay for now.

Pay close attention to the `Config` object we’re using.

To use different implementations, we’ll switch on the _config_.

In your `beforeAll`, notice the use of the `test:unit` config.

```tsx
composition = CompositionRoot.createCompositionRoot(new Config('test:unit'));
```

And let’s look at the config object again.

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

### **4.3 Change the composition root to make it use a new one based on the context.**

Now, within your composition root, you’re going to configure a different implementation based on the new environment.

Within your composition (the _usersModule_), you’ll want to introduce a method to determine whether you should build a real userRepo or a fake one:

_usersModule.ts_

```tsx
shouldBuildFakeRepository() {
  return (
    this.getScript() === "test:unit" ||
    this.getEnvironment() === "development"
  );
}
```

That way, when we build our `usersModule`, we create the correct one based on the script and the environment.

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
    
    // Use here!
    if (this.shouldBuildFakeRepository) {
      return new InMemoryUserRepository();
    }

    return new ProductionUserRepository(this.db.getConnection());
  }
}
```

Do you see? This is how we make our application composition **polymorphic**.

We’ve also just invented the concept of an `InMemoryUserRepository`.

Now let’s build it.

### **4.4 Write the fake implementation of the user repo.**

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

This **fake implementation** is a _Test Double_.

We’ll talk more about these in the next lesson.

### **4.5 Watch the test pass & do this for all of the tests.**

Now make everything that doesn’t compile, compile, jostling what needs to get jostled until your tests pass. This should be fairly minimal.

## Your Turn!

**Grading checklist**

- ✅ _I’ve written fake implementations of my&#xA0;_<!---->_**_external services_**_<!---->_&#xA0;and made sure that it’s what my high value unit test uses_
- ✅ _I’ve written fake implementations of my&#xA0;_<!---->_**_user_**_<!---->_&#xA0;_<!---->_**_repository_**_<!---->_&#xA0;and made sure that it’s what my high value unit test uses_
- ✅ _I’ve&#xA0;_<!---->_**_made all of the High Value Unit Test tests pass_**_<!---->_&#xA0;using the fake implementations_
- ✅ _I’ve used both&#xA0;_<!---->_**_Result_**_<!---->_&#xA0;and&#xA0;_<!---->_**_State Verification_**_<!---->_&#xA0;in all of my tests._

## FAQ

### “Why do we use Outgoing Contract test + High value Acceptance Test, instead of just using outgoing integration tests? It looks like we're doing integration testing with more work?”

- The green is a **high value unit test**, which means that it's core code (pure), and makes use of test doubles instead of the real production adapter so that the test is faster
- The orange is a contract test, which validates all of the adapters at the same time, thereby creating test parity
- We need the contract test because without it, we wouldn't have the psychological safety of knowing that our high value unit tests were sufficient (they are test doubles/mocks after all)
- This is a lesser known technique to still be able to write high value unit tests as your primary high value tests... with the stability of knowing your mocks are in sync with the real implementations as well (see the Transitivity Principle)

### “That’s cool and all… but what additional benefits do we get from this testing strategy (in the image above High Value **_Unit_** Testing **+** **Contract Testing**), over adopting **ONLY** High Value **_Integration_** Testing?”

Excellent questions.

The main reason is **focus**.

In fact, that’s the entire message behind everything I do. Behind everything, we use **focus** to **go deeper** into the problems, so that we can solve them properly, once and for all. Increasing the quality of your **focus** leads **to mastery** of the problems at the root level.

Very practically, here are a few scenarios:

**1) When you have no access to the infrastructure yet, you can start with high value unit tests**

Sometimes you don't have access to the infrastructure. This is common on the frontend, for example, when you're waiting for the backend team to get APIs implemented. Or you're waiting for someone to pay for access to a service.

What do you do? Wait?

No, in that case, you'd fake the integration using a test double.

And then what happens once the backend team implements the API?

You could either,

- a) turn your high value unit tests into high value integration tests (which is easy to do — you just flip a flag in your composition root), OR
- b) add the production implementations of the high value integration tests

**2) When you want FAST feedback in your Deployment Pipeline**

These tests are fast, so if you put them into the Commit Phase (or even using Husky in your local development environment) in the deployment pipeline, you don't need any infrastructure, and you can tell if your code works properly or not, quickly.

**3) You can build your entire frontend's business logic without React -> better focus & problem decomposition**

We haven't learned this yet, but you can model the entire frontend as an object similarly to how we deal with services on the backend, and from this, you can hook up react at the very end, starting with the tests to express all of the business functionality. Similar to #1.

**4) Focus / overwhelm → leads to better focus & problem decomposition.**

Sometimes it can be overwhelming to have to deal with everything all at the same time. some application/domains are just so complex, that you just want to focus in on that only.

With high value unit tests, you can put the persistence and fetching away for later, and just make sure that it's right, then connect adapters later. **This is the primary reason**.

It can be very discombobulating to flip between working on different abstractions. It's great to be able to just define the _contract_ for an external adapter, and then to finish what you're doing, and then focus on the adapters later as a separate activity.

**5) Focus/overwhelm → leads to problem decomposition with a focus on the inputs & outputs → leads to the ability to introduce a functional core-imperative shell architecture.**

An advanced reason for this technique is the idea of the functional core, imperative shell.

Taking this approach, if you treat your application & domain layer as pure inputs & outputs, where your application & domain layer performs no side-effects, it merely returns the stuff that needs to get saved in a transaction upon return.

That would mean _createUser_ would not _save_ anything.

It would just return a UserCreatedEvent and a User, and that would get saved by the functional core. This architectural style is supported by the High Value Unit Test, which supports a core-code-oriented type of test.

---

All this aside, I still think High Value Integration testing is _ideal_ most of the time, but it's just more expensive - and sometimes we might not have access to the infrastructure just yet.

Ideally, one should aim to use the most production-like environment possible, so High Value Integration testing is going to usually be the best.

But I think High Value Unit + Contract is a way to decompose the problem even further, which may sometimes be the required strategy depending on the scenario.

Imagine trying to test a checkers game on the frontend. Maybe you don't yet know how you're going to translate a Drag and Drop npm library into a sort of infrastructure adapter, so you focus on the core functionality instead. I see it as zooming in and zooming out.

## Summary

- A high value unit test is another way for you to test the main acceptance criteria — the _vertical slice/feature_ — against the application as pure core code.
- High Value Unit Tests are run against the _service layer_ in 4 tiers, or the _application layer_ (as it’s known in the hexagonal architecture), where it validates both application layer code and domain layer code.
- These tests are fast, isolated, and provide a lot of control to you as a test designer through the use of test doubles.
- You can start writing high value unit tests alongside your e2e tests by simply cloning your e2e test specification and changing the composition root to compose your application in preparation for _high value unit tests_; such a configuration should build **test doubles** instead of production instances.
- While it is more commonly understood how to do this on only the backend, you can also write these on the frontend as well.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.
