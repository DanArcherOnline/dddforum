# Communication Verification: How to Spy & Mock w/ Hand-Written Test Doubles 
#subjectVerification

_Last updated: Sept 20th, 2024_

_Topics: test doubles, spies, indirect inputs & outputs, hand-written vs. framework/library test doubles, commands and queries_

_Major Topics: Test Driven-Development, Behaviour-Driven Design, Design Patterns_

Now that we’ve learned how to _High Value Unit Test_, I’ll show you how to enhance your tests with the final form of _Subject Verification_ — **communication verification**.

In this lesson, we’re going to learn about test doubles, how to use hand-written test doubles (_spies_) to perform communication verification.

## Lesson Goals

- _What is communication verification and how does it help us?_
- _Understanding spies & the philosophy of test doubles_
- _How to implement hand-written test doubles (spies) to perform communication verification_

## Recap: What is Communication Verification?

Throughout _Best Practice-First_, we’ve covered various forms of **Subject Verification**.

We learned that there was:

- _Result Verification_
- _State Verification_

And then finally:

- _Communication Verification._

What’s communication verification again? What’s it for?

**Communication verification** is the final form of Subject Verification that concerned with **verifying attempted state changes** against _indirect outputs_.

### And why is this important?

Oftentimes, you want to validate **when** and **how you’re _ATTEMPTING TO CHANGE THE STATE_** of an **Indirect Output**.

I’ll give you two examples.

**Example #1: Dropbox / Google Drive Sync**

Synchronizing files is expensive. If I were to design the Dropbox or Google Sync functionality, it would be very important to ensure that we don’t attempt to synchronize a file (or an entire folder) unless it _actually_ changed.

What if we could _verify_ calls to a _job queue_ to start synchronizing. What if we could verify that we only started syncs when it was actually necessary? And what if we could verify that those sync jobs were called with the _correct_ files and folders to sync?

That’d be ideal, wouldn’t it?

**Example #2: Calling a Stripe API to Bill a Customer**

Imagine trying to bill a customer the WRONG AMOUNT because some aspect of your domain and application layer code was off.

You can test this functionality way ahead of time **before** you make that mistake with **high value unit tests** and Communication Verification.

### Use a mixture of state, result & communication verification to enhance your tests

These are more extreme examples, but in actuality, as we discussed in [3 Types of Verification](https://www.essentialist.dev/products/the-software-essentialist/categories/2154926214/posts/2166052479), you’re only _enhancing_ your tests by adding a mixture of _State, Result_ and _Communication Verification_.

You know for certain that you should be attempting to `save` at the end of a successful use case, and that you **should not** be attempting to `save` at the end of a failed one.

Sometimes it’s not necessary because you can verify what you want to verify with _Result Verification_ or _State Verification_, but it’s good to have this skill in your testing toolbelt.

### What exactly is a test double?

I define a test double as any object which _stands in_ for a real, production instance.

And the main reason for test doubles is to **force program behaviour in one direction or another** to isolate a specific part of the system, to evoke and validate your program behaviour in different circumstances.

- **a test double as a STUB** or **DUMMY** **just** fills in parameters lists or arguments
- **a test double as a MOCK** implements some behaviour for an Indirect Input (and/or Indirect Output) which can influence the way your Subject Under Test behaves
- **a test double as a FAKE** is basically the same thing as a Mock, it’s just called a different name
- **a test double as a SPY** records the way it was called and provides methods to introspect the way it was called later; this is what we need to do **communication verification**

At least, these are my definitions — but the differentiation isn’t all that important. Call them whatever you like in your tests, but it’s about the **intent and behaviour** of the test double.

### What do spies do?

Typically, when I wrote spies, I like to validate either:

- _how many times something was called_
- _if / how something was called (the arguments)_

Therefore, when we turn your **user repos** or your other **infrastructure adapters** into spies, you’ll see Communication Verification statements like this:

```tsx
spy.methodWasCalledWith('method name', 'some argument') // true or false
spy.methodWasCalledWith('method name', { id: 2, name: "Bob "}) // true or false
spy.getTimesMethodCalled('sendEmail'); // number
```

### There are 2 ways to implement spies

I’ve found that there are fundamentally 2 ways to implement spies.

You can either:

1. use _polymorphic_ _hand-written test doubles_
2. or you can use the _testing library’s mocking features_ to mock/patch the entire object or specific methods

In this lesson, we’re going to see what **hand-written spies** look like.

We’ll see how to use the testing library features in the “Incoming Contract Test” lesson.

So then let’s do it!

## Turning your userRepo into a hand-written spy

Let’s take a look at the High Value Unit test again, which should be working by now.

Looking at the success scenario `Successful registration with marketing emails accepted`, we’ll enhance this test using spies.

### **1. Write the communication verification statement.**

Let’s again start from the end of the test and add a communication verification statement like so.

```tsx
then('I should be granted access to my account', async () => {
  expect(createUserResponse.id).toBeDefined();
  expect(createUserResponse.email).toEqual(createUserInput.email);
  expect(createUserResponse.firstName).toEqual(createUserInput.firstName);
  expect(createUserResponse.lastName).toEqual(createUserInput.lastName);
  expect(createUserResponse.username).toEqual(createUserInput.username);
  
  // And the user exists (State Verification)
  const getUserResponse = await application.users.getUserByEmail(createUserInput.email);
  expect(createUserInput.email).toEqual(getUserResponse.email);

	// New! (communication verification)
  expect(userRepoSpy.getTimesMethodCalled('save')).toEqual(1);
})
```

What are we doing here?

We’re saying that we expect the user repo’s save method to have been called once!

Makes sense for this success scenario, right?

Then let’s actually implement the spy.

We’ll call it a `InMemoryUserRepositorySpy`.

Here are the relevant aspects from the test.

```tsx
defineFeature(feature, (test) => {
	...
  let userRepoSpy: InMemoryUserRepositorySpy;

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(new Config('test:unit'));
    application = composition.getApplication();
    userRepoSpy = composition.getRepositories().users as InMemoryUserRepositorySpy
  })

  afterEach(async () => {
    ...
    userRepoSpy.reset();
  });
```

### **2. Turn your user repo into a spy, give it spy functionality & make the test pass.**

Now that we have the test written, let’s make it pass by implementing the spy.

Due to how polymorphism works, you’re going to have to implement all of the functionality of a `UserRepo`, but you’ll do so using an _in memory_ implementation instead of talking to a database.

```tsx
export class InMemoryUserRepositorySpy implements UsersRepository
{ }
```

If you’re using GitHub Copilot or Cursor, you can do this really quickly without too much thinking. It’s all good, because we’re going to test it anyway in our contract tests.

Here’s a bit of what mine spat out.

```tsx
import { ValidatedUser } from "@dddforum/shared/src/api/users";
import { Spy } from "../../../shared/testDoubles/spy";
import { UsersRepository } from "../ports/usersRepository";
import { CreateUserCommand } from "../usersCommand";
import { User } from "@prisma/client";

export class InMemoryUserRepositorySpy implements UsersRepository
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
  // more
}
```

All good, right?

But what about those calls.. `getTimesMethodCalled`?

Those don’t exist anywhere yet, so they’re probably still throwing errors in your test.

Yep. Now we have to introduce the abstraction of a **spy**.

### **3. Abstract the spy functionality**

I’ll skip straight to the end.

Here’s what my `InMemoryUserRepoSpy` will look like.

```tsx
import { ValidatedUser } from "@dddforum/shared/src/api/users";
import { Spy } from "../../../shared/testDoubles/spy";
import { UsersRepository } from "../ports/usersRepository";
import { CreateUserCommand } from "../usersCommand";
import { User } from "@prisma/client";

export class InMemoryUserRepositorySpy
  extends Spy<UsersRepository>
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
    this.calls = [];
    this.users = [];
  }
}
```

What’s going on here?

Well, most of it is communicated here.

```tsx
export class InMemoryUserRepositorySpy
  extends Spy<UsersRepository>
  implements UsersRepository
{
```

Those _spy-like_ methods — I could have placed them directly onto `InMemoryUserRepositorySpy` and that would have been fine, but honestly, using a little bit of _Obvious Implementation_, I knew that I was going to have to do a lot of spying, and I’d have to do that with other objects as well.

So we use **inheritance**.

To not end up duplicating the same types of methods multiple times, I opted for a base `Spy` parent class.

By `extends Spy<UsersRepository>`, we are saying that the `InMemoryUserRepositorySpy` is a **spy** of the type **UserRepository**. This gives us access to some neat things within the **Spy** base class.

Check it out.

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

Just so you know, all of this was done **by programming by wishful thinking**. Don’t get confused, I’m not a master with TypeScript types and all that. I just know how to specify what I want, and how to figure out how to get the language to do what I want it to do.

And that’s how I’d approach any language or tool.

Starting from the **subclass** (the `InMemoryUserRepoSpy` ), my focus was on expressing what I want to express. And then came the _how_. This base class was the how.

So all this stuff of generics, getting type completion on the `MethodName` and so on — these are all things I remembered how to do on the fly not having done them for a long time, with a little bit of messing around with the implementation.

### 4. Spy on the rest of the tests

That should be enough to get your tests to pass. So make sure that they’re passing before we continue. Do this for all your tests that involve user repos. Make sure that you get a _save_ when you expect a save, and that you _don’t_ get a save when you don’t expect one.

With this written once, we now have a valuable piece of testing infrastructure through which we can turn any of our test doubles into spies.

And that’s what we’ll do in the next steps.

## Spying on your marketing & notification APIs

### **1. Write the communication verification statements for your marketing and notifications API calls.**

Now let’s think about the other two infrastructure adapters — the _transactionalEmailAPI_ and the _contactListAPI_.

How should they behave?

Coming back to the successful registration feature.. it’s clear that the three command-like operations we perform against external infrastructure are:

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

### **2. Create alternate versions of these as well for testing.**

Go ahead now and repeat the same process, creating fake versions of both the contactListAPI and the transactionalEmailAPI.

### **3. Adjust your composition root to handle these new ones.**

And just as well, go ahead and adjust the composition root the same way we did it with the userRepo as well.

### **4. Turn the external service adapters into spies as well.** And just as well, turn them both into spies.

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

### **5. Make all your tests pass, adding these additional spies where necessary.**

Do this for all of your tests where necessary.

## Your Turn!

**Grading Checklist**

- 🔘 _I have used communication verification to verify that the **indirect outputs** have been called_
    - _userRepo’s ‘”save” gets called when appropriate_
    - _transactionalEmailAPI’s “sendEmail” gets called when appropriate_
    - _marketingAPI’s “addToContactList” gets called when appropriate_ </aside>

## FAQ

### Should you use hand-written spies or a testing library instead?

I prefer to use _hand-written spies_ for **outgoing** and _jest_ for **incoming**.

You’ll see how we do the _incoming_ technique in “How to Write Incoming Adapter (Contract) Tests”

### Should you use Communication Verification to verify queries as well?

No. It’s not recommended.

A _query_ is an implementation detail.

A _query_ is always something you do to get the data (a how) before you make a state change based on that data (the what).

Focus on writing tests that verify the **What (commands/state changes)** because the **Hows (queries)** that support the **Whats** may very well change.

### So then, reiterated: how do you validate indirect outputs?

You’ll use either **State Verification** or **Communication Verification** because these two are all about state changes.

- State Verification is about the _new_ state of the indirect output
- Communication Verification is about _attempted state changes_ to the indirect output

### Isn’t it possible to completely avoid the need for Communication Verification?

Yes, it is.

But you’ll need to utilize the **functional core, imperative/reactive shell architecture**.

With this architectural pattern, your application & domain layers _do not_ make state changes. They merely **return** side-effects.

That means that everywhere you see _userRepo.save_ or anything else transactional in the middle of your services — not happening in this architecture.

Instead, you return the side-effects and leave your **infrastructure layer** to persist all side effects.

We’re taking a more object-oriented and imperative approach right now, because it’s what’s most common, but the functional approach is elegant, requires less complex testing, and I just think it’s safer in the long run.

It does take a fairly big mindset shift, and one could argue that it’s more advanced, though.

## Summary

- Communication verification is final of the 3 forms of Subject Verification techniques.
- It helps you verify attempted state changes against indirect outputs.
- Test doubles come in various forms: _mocks, spies, fakes, stubs_.
- Test doubles that perform **communication verification** are said to be _spies_.
- You can implement test doubles as either hand-written test doubles or using a testing library like Jest.
- I recommend hand-written test double for Outgoing Adapter test doubles and Jest for Incoming Adapter test doubles.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.