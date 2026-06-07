# How to Design a Modular Monolith using Abstraction Principles

\#verticalSlicing

_Last updated: August 29th, 2024_

_Topics: modular monoliths, abstraction, organization, shared modules, vision-role-goal-capability-feature, modules, deployable unit of code_

_Major Topics: Design principles, architectural patterns, design patterns_

So far, we’ve characterized DDDForum and refactored to 4 tiers.

This shouldn’t have been too hard because we only have a few features.

But let’s be real, your actual codebase is just going to continue to expand and expand.

It’s never this easy.

Well, in my search for some semblance of _truth_ in terms of how to organize code properly, I can say that the Modular Monolith seems to be the most effective abstraction and metaphysics-based folder structure I’ve ever come across.

Let’s examine this from a few angles and make sure we know how to put it into practice.

## Lesson goals

Specifically, in this lesson we will cover:

- what is a modular monolith & why is it effective?
- what are the typical folders for a modular monolith
- how to maintain a modular monolith over time

## Final rant on why “package by infrastructure” doesn’t work

Refreshing your memory again — this is what **package by infrastructure looks like**.

And why doesn’t it work?

Guess.

Because it doesn’t adhere to the metaphysical laws of abstraction.

Yep. That’s it.

Abstraction, goal achievement, problem solving — it all works a certain way. First in the mind, then stapling in who we’re helping, why, what they can do, and finally how.

_Vision-Role-Goal-Capability-Feature-Scenario-Examples._

_Vision-Role-Goal-Capability-Feature-Scenario-Examples._

_Vision-Role-Goal-Capability-Feature-Scenario-Examples._

Never forget this.

And because you’ve got to _add, change, discover, understand, test, debug_ features, you want the ability to **quickly** find the _features_ in the codebase through conscious design.

And when we do **package a single deployable** unit of code this way (package by abstraction), we’re building a modular monolith.

## Modular Monoliths: What & Why?

I’ll define it as a **(1)** **single deployable unit of code (2) packaged by abstraction**.

### 1. Single deployable unit of code

A single deployable unit of code is what it sounds like.

Are we deploying an entire backend or an entire frontend or are we using something like Next and deploying both a backend and a frontend using templating?

Whatever it is we’re deploying, “is it modularized”? That’s the question

### 2. Packaged by abstraction

If you’ve properly modularized your project, you’re going to spend a lot of time looking at folders that mimic the _capabilities_ and _features_, most likely.

For example, here are a few:

## The typical folders & structure of a modular monolith

Typically, we’re dealing with **two** main levels.

- **level 1 = src & tests**
- **level 2 = shared & modules (domain/capability modules)**

In level one, we split the main actions developers tend to do — _testing_ or _developing_ (note that this corresponds to the _Role-Goal_ aspect of Abstraction) — into two folders.

At level two, we organize the way we achieve those goals — _Capability-Feature_ — the **how** part (your actual code).

### The domain/capability modules

Your domain/capability modules are where the action happens.

It’s the primary place you’ll work: where your use cases, controllers, DTOs, and all your infrastructure pertaining to a specific feature live.

It’s the most valuable place in your codebase.

Ideally, your test code mimics your production code

### The shared module

The shared module is where you place concerns that don’t really have anything to do with a specific **feature**. It’s where you place code that, by placing it in a _domain-capability_ module would actually hurt cohesion.

For example, in one of these folders, you’re likely to see the more abstract, infrastructural, core, tooling-based concerns.

Plenty of core utilities and base classes also end up here.

## 3 tips for how to maintain a modular monolith over time

How to get started?

Here are 3 tips.

### Tip #1: Commit to following the contours of abstraction

Get these folders set up and start organizing.

That straightforward.

However, you should know that you will **never make it perfect. You’re always going to be slightly out of integrity, so don’t get lost in over-organization**.

Aim for good enough.

### Tip #2: Embrace feature → shared coupling

Some coupling is ok!

As I said, the shared folder exists for a reason. For example, if you come across code which is:

- _database connectivity logic_
- _infrastructural concerns_
- _utility classes_

Then feel free to see if you can decouple it out and move it.

### Tip #3: Limit (or restrict) feature → feature coupling

Feature code is allowed to rely on stuff that’s **shared** but there’s a major flaw when we rely upon other **features**.

For example, take this code which relies upon the `TransactionalEmailAPI`.

```tsx
export class UsersService {
  constructor(
    private repository: UsersRepository,
    private emailAPI: TransactionalEmailAPI,
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

At first glance, this might not appear to be such an issue, but I can tell you from experience that it _is_ and issue.

What we’re seeing here is a form of _coupling_ where the _createUser_ feature relies upon the _sendVerificationEmail_ from the _notifications_ domain/module, even if not expressed properly.

Why is this a problem?

Well, the code could fail **right after we save the user but never send the email verification**.

And now the system is in an inconsistent state.

That’s what this small problem of coupling can do.

Understand that the long-term solution is to introduce an event-based architecture to gain the ability to perform **Temporal Decoupling**, decoupling features from each other using events and transactions.

We’re not there yet but we’ll explore this in _Pattern & Responsibility-First._

For now, continue to couple so we can press forward.

## Why is this effective?

### Reason #1: Makes everything obvious

The biggest reason? With a cohesive structure like this, it is obvious where to find, add, change, test code and so on.

### Reason #2: Limits coupling between modules (or at least makes it obvious)

When you do this work, it’s hard to unsee the coupling.

If you’ve never done this before, it’s a long way from just writing whatever you want in Express controllers.

### Reason #3: Maximizes the ability to split code into new deployable units

When you minimize coupling, you maximize your ability to split code into new deployable units.

For example, it may be the case that your _forum_ aspect of your app actually gets a lot more traffic than the _chatroom_ does.

With decoupling as a foresight, in theory, you can split your application into multiple deployable units and vertically scale to handle traffic requirements.

## FAQ

### “Is it a modular monolith if I run two separate parts of the application with different scripts?”

So for example, if you’re deploying half of the application, like — _forum, users, notifications_ on one box, _admin_ on another box, and _chatroom_ on another — for understandability, maintainability, and keeping services decoupled, you likely want a design similar to this:

_monorepo_

- _dddforum (forum, users, marketing, notifications) — service (deployable unit of code)_
- _admin — service (deployable unit of code)_
- _chatroom — service (deployable unit of code)_
- _shared — (not deployed, shared across all, contains acceptance tests & types)_

This works because if you want to split more services out over time, if you’ve kept your coupling between modules to a minimum, you’ll limit the pain of doing so, turning it into its own package and deployable unit.

This gets ever increasingly complex with microservices, serverless, containers, orchestration, and so on — we’re trying to master the foundation that enables a fluid approach to these concerns.

This is the foundation.

Perhaps you can see that modular monoliths are more about **strategy** than anything else.

Makes sense why the Vaughn Vernon book is titled “_Strategic_ Monoliths and Microservices”.

### “Is a frontend application a modular monolith? “

Well, it’s a single deployable unit of code, but have you modularized it using abstraction?

Can you split it out into entirely separate _npm packages_ in your _monorepo_?

Do you _want_ to?

Some companies assign teams to specific pages or _components_ in the UI.

If you’re just getting started, you probably don’t need to think about this, but there are many legitimate reasons and ways to split a frontend.

## Your Turn!

Once you’ve split all the abstractions into 4 tiers, shift your focus to making sure each abstraction you’ve created is housed correctly.

You’ll be in good shape if it shares similarities to this.

For the submodule assignment, continue forward once:

✅ **🔘** With my backend code safely characterized and held in place with E2E tests, I have used package by abstraction to organize my production code into a modular monolith

## Summary

- A modular monolith is a well-packaged deployable unit of code.
- Using modules helps you keep your features decoupled.
- The benefits of decoupling features are better organization, scaling, and maintaining the ability to evolve to an event-based architecture, then eventually micro-services
- Make use of the shared folder + modules folder architectural pattern.
