# How to Design Scripts For High Developer Experience

[#verticalSlicing](#verticalSlicing)

_Last updated: August 29th, 2024_

_Topics: scripts, encapsulation, abstraction, environments, contexts, the config object, preparing the environment, developer experience, programming by wishful thinking_

_Major Topics: Design Principles_

Now that we’ve got our monorepo setup with the shared, frontend, and backend packages — AND we’ve got the _clean_ and _build scripts_ working across ‘em, I want to shift our awareness to the topic of **scripts** and scripts design.

Oh man, this can be a doozie. Let’s talk about it.

## Lesson goals

- What makes scripting difficult
- 5 tips to design better scripts
- How to set up the minimum required scripts for DDDForum backend

## Why scripting is so hard

Scripting.

It’s one of those parts of a project that, if done well — pays dividends down the road.

Your life can be _so much better_ with well designed scripts.

Or it can be hell 😂

As I write this, I’m getting flashbacks to those hours spent overnight in the computer lab in college trying to get my scripts to pass in the CI.

It kinda felt like I was fighting in quicksand.

I remember re-writing scripts over and over, making commits, watching things fail, and trying over and over, fighting with all sorts of low level details like missing environment variables and so on.

Oh body, what a mess.

If you’ve ever shipped anything, you know what I’m talking about.

Other common scenarios are:

- coming back to an old project
- running scripts that only sometimes work

So what’s the problem? Why is this so hard?

### Scripting as an afterthought

It’s the same reason we end up with spaghetti code.

**Usually, scripts-design tend to be an afterthought.**

Coming from Code-First, we tend to treat scripts as something we do _later on_ or _at the last minute._

I know this myself, because I’ve seen it and I’ve done it. Performing awkward actions over and over in multiple consoles in completely unscalable ways, compulsively, just so that I could get back to what I was more interested in working on. All instead of taking the time to design proper solutions.

Well, as we know from **The Metaphysics**, we run into a lot of problems if we don’t account for the _Role → Goal → Capabilities_ early on.

For example, if you plan on deploying the thing you’re building (which is almost always), you know that it’s best to figure out how to deploy **immediately**. That’s _The Walking Skeleton._ Bridge the gap towards the goal using the most minimal slice of functionality possible, as soon as possible.

### Confusion between variables, environments, contexts, actions

Another thing I’ve experienced is confusion around contexts, variables, environments, and actions.

_How do you set up environment variables properly?_

_What are the different types of environments?_

_How should I name and design my scripts? Based on the environments? (ie: start:dev)_

_How will my code change based on the environment?_

_Where do I handle the `process.env` in my codebase?_

_What are all the different types of actions/scripts I have to run anyway?_

_Where will I store my environment variables? What about my production variables?_

All this stuff gets super confusing, super fast, unless we gain clarity on it **upfront, early**.

Trying to figure this out **later on** once we’ve already got some scripts working locally and we’ve got to make changes to get deployments working later on — ahhh, that can get messy and annoying real fast.

Refer back to the _Abstraction @ The Best Practice-First Phase_ for more on why this happens.

## 5 tips for better scripts

With all that said, let’s talk about some of the techniques I’ve noticed help with script design in the Best Practice-First phase.

### 1. Establish the actions and environments upfront

In Domain-Driven Design, there’s something called _The Ubiquitous Language_. It’s basically the glossary of terms that domain experts in a certain domain use. And in DDD, we aim to gain clarity on this **common language** before we get deep into code.

What’s the idea here? How does this relate?

Well, it would help **tremendously** if we had an understanding of the **Ubiquitous Environments & Actions** that developers tend to perform.

In other words, “what are the environments we’re almost _always_ dealing with” and “what are the scripts/actions we’re almost _always_ writing when we’re setting up, testing, running and deploying our projects?”

Getting this clear in my head has REALLY helped me iron out the scripts design downstream.

Here’s what I’ve noticed.

It looks like the most common environments and actions are as follows:

- **environments**
  - dev — _when you perform an action/run a script on your local machine_
  - test — _when you perform an action/run a script on your test server_
  - ci — _when you perform an action/run a script in your CI server_
  - production — _when you perform an action/run a script in production_
- **actions/scripts** (grouped by capability → script name) _Starting_
  - start — _starting the application, may start differently depending on the&#xA0;_<!---->_**_environment_**

  _Testing_

  - test:e2e — _testing the application, may point to a different URL and include different implementations of infrastructural adapters depending on the&#xA0;_<!---->_**_environment_**
  - test:infra — _testing the application, may point to a different URLs for services, and include different implementations of infrastructural adapters depending on the&#xA0;_<!---->_**_environment_**
  - test:unit — _high value unit & typical tests, usually doesn’t change much based on&#xA0;_<!---->_**_environment_**

  _Building_

  - build — _builds the application_

  _Cleaning_

  - clean — _cleans the folders_

  _Linting_

  - lint — _lints the project_

You might be wondering, “why bother calling this out, this seems obvious”.

You’d be surprised.

When I was first building out the material here with fellow community crafters, we had a lot of confusion around how to name the scripts, the names of the environments, and where to put variables.

More questions like:

_Do we encrypt & decrypt environment variables?_

_Should we use something like Infisical? Or Vault?_

_Will we have a test server as well?_

_What tests do we run in the test server?_

_What does the pipeline look like?_

All this stuff needs an answer, which is what can make this take so long to get enough clarity on to document and decide.

By stapling in the **capabilities** and the **actions**, we were able to notice the pattern, agree on the _What_ and then shift our attention to _How_.

As the saying goes, “you have to name it to tame it”.

Here’s an image which **depicts** a common deployment pipeline w/ the scripts you’ll use on each stage.

Another reason why it’s so important to gain upfront clarity on the **environments** and the **scripts/actions** is because it was clear that we’d be swapping components in and out depending on the environment and the script/action we were running.

For example, when we run a **high value unit test (test:unit)**, we’d want to execute our tests against pure **core code**, so that meant we’d swap out our infrastructure adapters.

One of the first parts of setting up this sort of polymorphic, dynamic runtime behaviour was to encapsulate all these variants that affect the system as a whole into a **Config Object**.

```tsx
export type Environment = "development" | "production" | "staging" | "ci";

export type Script =
  | "test:unit"
  | "test:e2e"
  | "start"
  | "test:infra";

export class Config {
  env: Environment;
  script: Script;

  constructor(script: Script) {
    this.env = (process.env.NODE_ENV as Environment) || "development";
    this.script = script;
  }
}
```

We’ll explain more on this excellent pattern in a few lessons from now when we explain how we use it with **The Composition Root Pattern**.

### 2. Program by wishful thinking (if you don’t like it, change it)

“If you don’t like it, change it”.

It’s simple, but sometimes you’ll be using a library or framework that wants you to do something in some way that you don’t agree with.

For example, prisma makes it really easy for you to get started by setting up a default ./prisma folder in your root directory.

But what if we don’t want that?

What if we want to move it to `shared/database/prisma` as an act towards keeping things as **modularly monolith-y** as possible?

Well, that’s possible, but sometimes it’s going to mean adjusting your scripts to do things like this.

For example, we had to change the way we designed our backend scripts using the —schema flag in our scripts.

```json
"scripts": {
  "build": "tsc -b tsconfig.json && npm run generate",
  "generate": "ts-node prepareEnv.ts prisma generate --schema=./src/shared/database/prisma/schema.prisma",
  "migrate": "ts-node prepareEnv.ts prisma migrate dev --schema=./src/shared/database/prisma/schema.prisma",
  "db:seed": "ts-node prepareEnv.ts prisma db seed --schema=./src/shared/database/prisma/schema.prisma",
  "db:reset": "ts-node prepareEnv.ts prisma migrate reset --preview-feature --schema src/shared/database/prisma/schema.prisma && npm run migrate && npm run generate",
  "start:dev": "npm run migrate && npm run generate && npx nodemon",
  "start:dev:no-watch": "npm run migrate && npm run generate && ts-node prepareEnv.ts ts-node src/index.ts",
  "lint": "eslint . --ext .ts --fix",
  "test": "jest",
  "test:dev": "jest --watchAll",
  "test:e2e": "jest -c jest.config.e2e.ts",
  "test:e2e:dev": "jest -c jest.config.e2e.ts --watch"
},
"husky": {
  "hooks": {
    "pre-commit": "npm run test && npm run prettier-format && npm run lint"
  }
},
"prisma": {
  "seed": "ts-node ./src/shared/database/prisma/seed.ts"
},
```

Really, the principle is yet again, focus on **What** you want first, and the **How** separately, afterwards to actualize it.

_“Wait, what’s going on with those prepareEnv.ts statements?”_

I’ll explain.

### 3. Introduce an environment processing layer

Most developers tend to organize their environment variables in some sort of fashion like

- .env.development — _where you’d hold the variables for the development environment_
- .env.test — _hold the variables for the test environment_

When we moved the prisma folder elsewhere, we noticed that we weren’t actually loading up the environment variable files anymore.

For example, if we wanted to run `prisma migrate dev` on our local machine, it’d need to access the right environment variable file (the .env.development) one.

But it wasn’t.

Much props to _@_**Kirill Karpov** **for this genius idea — he built a sort of&#xA0;**<!---->**<!---->processing / preparation** layer of abstraction which enables us to _Horizontally Decouple_ before we load up the script in question.

```tsx

/**
 - This script allows you to call any other following script with
 - `ts-node prepareEnv <whatever you want to call next>` and if your app
 - is running in development mode (not no NODE_ENV set at all, assumed), it
 - will load the env file before you call the script. This loads the environment
 - up properly.
 - * We currently need this for prisma commands to allow prisma to take the config from
 - .env.development in development mode, and from the secrets in the deployment tools in
 - production.
 */

import { execSync } from 'child_process';
import * as path from 'path';

export const prepareEnv = (): void => {
  const env = process.env.NODE_ENV || 'development';
  const packageRoot = path.resolve(__dirname);
  const execParams = {
    cwd: packageRoot,
    stdio: 'inherit',
  } as const;

  const script = process.argv.splice(2).join(' ');

  if (env === 'development') {
    const devEnvFile = '.env.development'
    console.log(`Preparing dev environment using ${devEnvFile}`);
    execSync(`dotenv -e ${devEnvFile} -- ${script}`, execParams);
    return;
  }

  console.log(`Running ${script} in ${process.env.NODE_ENV} mode without loading from env file.`);
  execSync(`${script}`, execParams);
  
};

prepareEnv();
```

There’s a lot of reasons why I really like this approach. But perhaps the greatest reason is because it gives us the ability to introduce **constraints & signifiers**.

### 4. Run checks (constraints and signs) in your environment setup / processing layer

If you’ve read _The Design of Everyday Things_ or _Humans & Code_ from solidbook, you’ll recall the ideas of constraints & signs — key elements of design.

Constraints prevent certain actions. An example of a **real-world constraint** can be seen when you use an ATM — it forces you to take your card back first **before** you get your money. Why? Because you’d probably forget your card and walk away if you got the dispensed money first, since your primary goal was to get money from your account.

Signs are basically messages. For example, it’s when the door actually reads the word “PUSH” on it. They tell you what to do.

So what’s the point?

Well, by introducing an additional processing layer like we've done above, we gain the ability to prevent a number of downstream issues and **get notified early**.

For example, using a library like `env-var` or `envalid`, you can check to make sure your environment is **actually** loading up the environment variables you need before you continue along.

```tsx
import { cleanEnv, str, email, json } from 'envalid'

const env = cleanEnv(process.env, {
  API_KEY: str(),
  ADMIN_EMAIL: email({ default: 'admin@example.com' }),
  EMAIL_CONFIG_JSON: json({ desc: 'Additional email parameters' }),
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
});

// If anything specified isn't found, it'll throw an error

// Read an environment variable, which is validated and cleaned during
// and/or filtering that you specified with cleanEnv().
env.ADMIN_EMAIL // -> 'admin@example.com'
```

That’s huge.

It’s like a sort of **reverse debugging**. You’re preventing downstream issues before they can even happen with an approach like this.

That’s just one of the things you can do with a layer of code like this.

Say you were using Docker (which we will be using later on) and you wanted to confirm that it’s up and running before starting the backend. You can run checks here.

### 5. Make it easy to use with encapsulation & idempotency

Another problem you’re guaranteed to run into is **scripts not working repeatedly or consistently**.

Ah, we’ve seen that before haven’t we?

You betcha.

Remember that this is called idempotency.

Imagine you want to run the backend but it doesn’t work because you haven’t run the migrations, the seeder script or the Docker instance hasn’t been started.

Okay, that’s pretty annoying.

And one initial step might be to design the script to say “yo, you gotta run the migrations first” which is always better than a nebulous error message.

But even better than that is actually **encapsulating the work which must be done within the script itself**.

Take a look at the way we’ve designed the backend scripts again.

```json
"scripts": {
  "build": "tsc -b tsconfig.json && npm run generate",
  "generate": "ts-node prepareEnv.ts prisma generate --schema=./src/shared/database/prisma/schema.prisma",
  "migrate": "ts-node prepareEnv.ts prisma migrate dev --schema=./src/shared/database/prisma/schema.prisma",
  "db:seed": "ts-node prepareEnv.ts prisma db seed --schema=./src/shared/database/prisma/schema.prisma",
  "db:reset": "ts-node prepareEnv.ts prisma migrate reset --preview-feature --schema src/shared/database/prisma/schema.prisma && npm run migrate && npm run generate",
  "start:dev": "npm run migrate && npm run generate && npx nodemon",
  "start:dev:no-watch": "npm run migrate && npm run generate && ts-node prepareEnv.ts ts-node src/index.ts",
  "lint": "eslint . --ext .ts --fix",
  "test": "jest",
  "test:dev": "jest --watchAll",
  "test:e2e": "jest -c jest.config.e2e.ts",
  "test:e2e:dev": "jest -c jest.config.e2e.ts --watch"
},
"husky": {
  "hooks": {
    "pre-commit": "npm run test && npm run prettier-format && npm run lint"
  }
},
"prisma": {
  "seed": "ts-node ./src/shared/database/prisma/seed.ts"
},
```

When we run **npm run start:dev**, it actually kicks off a ton of different sub-scripts to make sure that our application is in a consistent state for us to just focus on what we originally wanted to do: _start in development mode_.

And if there’s ever something else that needs to get started or set up beforehand, we can encapsulate a script in either the _prepareEnv_ or inline in the package.json script.

## Your Turn!

So those are a few of the key tips for scripts design. Now let’s actually set up the scripts we need to continue along.

For the submodule assignment, continue forward once:

✅  When you run **npm run start:back,** it should start the backend, run the migrations, seed the database and then run in development mode

✅  When you run **npm run start:front,** it should start the frontend in development mode

✅  When you run **npm run test:e2e:front,** it should run the acceptance tests for the frontend using the shared acceptance test

- **🔘** _I have a script which calls jest-cucumber to run my acceptance test (e2e) against my frontend (which does nothing at the moment)_

✅  When you run **npm run test:e2e:back,** it should run the acceptance tests for the backend using the shared acceptance test

- **🔘** _I have a script which calls jest-cucumber to run my acceptance test (e2e) against my backend_ 

By the end, you should have a set of top-level scripts that look like the following:

```json
"test:e2e:front": "npm run test:e2e --workspace=@dddforum/frontend",
"test:e2e:back": "npm run test:e2e --workspace=@dddforum/backend",
"clean": "npm run clean --workspaces --if-present",
"build": "npm run build --workspaces --if-present",
"lint": "npm run lint --workspaces --if-present",
"start:dev:back": "npm run start:dev --workspace=@dddforum/backend",
"start:dev:front": "npm run start:dev --workspace=@dddforum/frontend",
```

Your High Value E2e test scripts should use the following acceptance test specification. This is what we’ll be using to characterize in the following lesson:

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

If you get stuck, you can take a look [at the solution code](https://github.com/stemmlerjs/the-software-essentialist/tree/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart3/assignment/end) to peek around and see how this works.

## Summary

- Script design is hard because oftentimes, we leave it till the very end to invest significant time and energy into it. By then, we’re often caught catching up to previous design decisions that make it difficult to adjust.
- It’s a great idea to clarify all the scripts you’ll need in advance so you can mitigate frustration by anticipating potential challenges.
- Try introducing an environment / processing layer for your scripts to report missing environment variables, confirm the state of the world, and mitigate potential downstream issues early — failing fast.
- With clarity on the scripts you need, instead of forcing clients to know about pre-conditions and pre-scripts, use encapsulation and idempotency to keep things simple and minimize leaky abstractions.
