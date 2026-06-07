# How & Why to Encapsulate Application Composition (using the Composition Root Pattern)

\#composition

_Last updated: August 29th, 2024_

_Topics: the composition root pattern, the singleton pattern, pivot points, the config pattern, polymorphism_

_Major Topics: Design Patterns, Design Principles_

Where are we so far?

You’ve gone ahead and characterized DDDForum. You’ve refactored to 4 tiers. It should be looking a lot more shapely now, putting everything we’ve learned thus far into practice.

In this lesson, we’re going to return to the topic of composition and explore some vital improvements that make for flexible, dynamic testable code.

## Lesson goals

Specifically, we will:

- learn the challenges you’ll face bootstrapping from a single location
- recap what polymorphism is and why it’s so important to the way we compose our applications
- learn how to use the composition root pattern to build dynamic runtime behaviour into the composition process

## The problem with bootstrapping

Remember the idea of bootstrapping from the Classroom exercise?

When we composed the entire application from a single entry point, sort of like one of those Russian dolls? Dependency injecting one dependency into another?

```tsx
import Server from "./server";
import Database from "./database";
import {
  AssignmentsController,
  ClassesController,
  StudentsController,
} from "./controllers";
import {
  AssignmentsService,
  ClassesService,
  StudentsService,
} from "./services";
import { errorHandler } from "./shared/errorsExceptionHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const db = new Database(prisma);

const studentsService = new StudentsService(db);
const classesService = new ClassesService(db);
const assignmentsService = new AssignmentsService(db);

const studentsController = new StudentsController(
  studentsService,
  errorHandler
);
const classesController = new ClassesController(classesService, errorHandler);
const assignmentsController = new AssignmentsController(
  assignmentsService,
  errorHandler
);
const server = new Server(
  studentsController,
  classesController,
  assignmentsController
);

export default server;
```

Well, this is good and all when we’re just getting started, but the reality is it’s not sufficient for most scenarios.

Why not?

Well, imagine we were **logging** all over our codebase? What if we had a `LoggingService` that, when we ran in development mode, logged to the console — and when in test or production, logged to a file or an external service? How do you configure that?

Or what about the fact that when we run our application in production, we use **all real services**, but when we run a test like the _High Value Unit Test_ with “test:unit”, we’d use **fake services**?

How do we get _dynamic runtime behaviour?_

Well, we _could_ have a bunch of “if env === production” statements throughout the codebase, or we could put ‘em all at the top of the bootstrap file.

```tsx
if (env === 'production') {
  database = new ProductionDatabase()  
} else {
  database = new FakeJsonTestDatabase()  
}
```

But that’s not nearly as clean or configurable as we want.

As a rule of thumb, if you ever see yourself doing something like this, what you’re _really_ looking for is probably **polymorphism**.

Let’s take a moment to re-remember how it works. Without saying it explicitly, we’ve been practicing it all over the place.

## Remembering polymorphism

Okay so what is polymorphism exactly?

Polymorphism refers to the ability for an object to take multiple different shapes and behaviours, yet still fulfill a contract.

Recall that this phase, the _Best Practice-First Phase_, is signified by a few major context shifts in the worldview that developers have when they approach their work.

And the most major context shift is the adoption of **contracts** — **using Abstraction (What & How)** to derive what you create first theoretically, then physically.

The very fact that we’re using an **acceptance test** and _implementing_ it on both the frontend and the backend **is an example of polymorphism**.

How? Well, the abstraction notion of _What_ (ie: features) end up implemented on both frontend and backend in differing yet still completely valid ways.

### More real world uses for polymorphism

Everyone knows the _Animal-Dog-Cat_ examples of polymorphism, which isn’t all that useful when you learn about it. But you can probably now notice that the example _could_ be useful when approached within the context of a _Role-Goal-Capability-Feature_ perspective.

More realistic scenarios where we need polymorphism can be found in things like:

- **Text Editor Theming**. You want your text editor to look like Nightrider with some cool 80’s themed colors. Or maybe you’re a disturbed corporate developer and for some reason you want a white text editor 😂  Well, the entire ability to **dynamically shift themes** is a polymorphic function. What varies is the _painting_.
- **Designing Weapons**. What varies is the _behaviour_ of the weapon, which may include many varying aspects including the way the weapon is rendered, the rate in which it decreases an enemy’s HP, how much ammo it has (if it’s a _FirableWeapon_), so on and so forth. But it still conforms to the **contract** of a weapon. It’s still _Equippable, Renderable_. What varies are all these things.

Now, those are more complex, hardcore applications of polymorphism, for sure. But bringing it back down to web development land, there are tons of scenarios where we need it.

The most obvious one _is_ application composition. Because if you want to design your application to be testable and flexible, it is **inherent that you design it with polymorphism**.

### How application composition varies

Remember the Config Object I alluded to earlier? Remember the variance in Scripts/Actions + Environments?

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

It tells us that we are either **running the app** in some **environment** or **testing the app** in some **environment**.

But the funny thing is, it’s that **combination** which has the possibility to completely change the way we build/compose our app.

So as the principle goes, we’ve got **encapsulate what varies**.

And what varies is the **application composition itself**.

So that’s why we use the Composition Root Pattern.

## The Composition Root Pattern

The Composition Root Pattern encapsulates application composition. In particular, there are five things you should know about it.

1. It composes the application
2. It acts as the single entry point for running and testing
3. It gives us direct access to the application objects
4. It is a singleton
5. It enables you to perform polymorphic application composition based on the combination of **Action/Script + Environment**.

Let’s discuss each.

### Composing the application

The first and most important is that it acts as the place that we compose the application.

Here’s a brief example of how it could work, composing just the _users_ objects in addition to some of the _shared_ ones.

```tsx
import { 
 WebServer, 
 UsersController, 
 UsersService, 
 Database, 
 ErrorHandler, 
 Config 
} from ".";

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;
  
  private webServer: WebServer;
  private dbConnection: Database;
  private config: Config;
  private errorHandler: ErrorHandler;
  private usersService: UsersService;

  public static createCompositionRoot(config: Config) {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new this(config);
    }
    return CompositionRoot.instance;
  }

  private constructor(config: Config) {
    this.config = config;
    this.errorHandler = errorHandler;
    this.dbConnection = this.createDBConnection();
    this.usersService = this.createUserService();
    this.webServer = this.createWebServer();
  }

  private getUsersService() {
    return this.usersService;
  }

  private getErrorHandler() {
    return this.errorHandler;
  }

  private createUserService() {
    const dbConnection = this.getDBConnection();
    return new UsersService(dbConnection);
  }

  private createControllers() {
    const usersService = this.getUsersService();
    const errorHandler = this.getErrorHandler();
    const usersController = new UsersController(usersService, errorHandler);

    return {
      usersController,
    };
  }

  private createDBConnection() {
    const dbConnection = new Database();
    if (!this.dbConnection) {
      this.dbConnection = dbConnection;
    }
    return dbConnection;
  }

  getDBConnection() {
    if (!this.dbConnection) this.createDBConnection();
    return this.dbConnection;
  }

  createWebServer() {
    const controllers = this.createControllers();
    return new WebServer({ port: 3000, env: this.context }, controllers);
  }

  getWebServer() {
    return this.webServer;
  }
}
```

In the constructor, we build all of the objects in sequence, similar to how we did it when we just bootstrapped everything by passing objects into each other to build up to our app, but here, we merely encapsulate that work.

### Single entry point for running & testing

Recall that this is the single entry point for both **testing** and **running the application**.

To use it in your tests, you’d get access to it like this.

```tsx
defineFeature(feature, (test) => {
  let composition: CompositionRoot
  let config: Config = new Config("test:e2e");
  

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(config);
    server = composition.getWebServer();
    databaseFixture = new DatabaseFixture();
    dbConnection = composition.getDBConnection();

    await server.start();
    await dbConnection.connect();
  });
```

Notice that we use the **Config Object** to specify and pass in the options. That’s grand. With those options encapsulated, it gives us the ability to do interesting things with the way we compose the app — and to do so without a ton of if/else statements littered throughout our codebase.

The second place you’ll use it is when you’re starting up your application

_shared/bootstrap.ts_

```tsx
import { CompositionRoot } from "../compositionRoot";
import { Config } from "../config";

const config = new Config("start");

const composition = CompositionRoot.createCompositionRoot(config);
const webServer = composition.getWebServer();
const dbConnection = composition.getDBConnection();

export async function bootstrap() {
  await dbConnection.connect();
  await webServer.start();
}

export const app = webServer.getApplication();
export const database = dbConnection;
```

### It gives us direct access to the application objects

Notice in the previous code that we get access to the server and the database connection from the composition root. That’s awesome.

```tsx
defineFeature(feature, (test) => {
  let composition: CompositionRoot
  let config: Config = new Config("test:e2e");
  

  beforeAll(async () => {
    composition = CompositionRoot.createCompositionRoot(config);
    server = composition.getWebServer();
    dbConnection = composition.getDBConnection();

    await server.start();
    await dbConnection.connect();
  });
```

Not only is the API cleaner for our tests so we can start and stop the server before and after everything, but it forces us to encapsulate things that we often don’t encapsulate, like the server itself.

For example, a lot of the time, your server might just look like this:

```tsx
app.start(port)
```

Instead, with composition, it forces you to really think about your objects — **all of them**.

We’ve designed a server as thus.

**_shared/http/server.ts_**

```tsx
import express from "express";
import cors from "cors";
import { Server } from "http";
import { 
  ProcessService 
} from "@dddforum/backend/src/shared/processes/processService";

interface WebServerConfig {
  port: number;
  env: string;
}

export class WebServer {
  private express: express.Express;
  private state: "stopped" | "started";
  private instance: Server | undefined;

  constructor(private config: WebServerConfig) {
    this.state = "stopped";
    this.express = express();
    this.initializeServer();
  }

  private initializeServer() {
    this.addMiddlewares();
    this.express.use(cors());
  }

  private addMiddlewares() {
    this.express.use(express.json());
  }

  public mountRouter(path: string, router: express.Router) {
    this.express.use(path, router);
  }

  public getApplication() {
    return this.express;
  }

  async start(): Promise<void> {
    return new Promise((resolve, _reject) => {
      ProcessService.killProcessOnPort(this.config.port, () => {
        if (this.config.env === " test") {
          resolve();
        }
        console.log("Starting the server");
        this.instance = this.express.listen(this.config.port, () => {
          console.log(`Server is running on port ${this.config.port}`);
          this.state = "started";
          resolve();
        });
      });
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      if (!this.instance) return reject("Server not started");
      this.instance.close((err) => {
        if (err) return reject("Error stopping the server");
        this.state = "stopped";
        return resolve("Server stopped");
      });
    });
  }

  isStarted() {
    return this.state === "started";
  }
}
```

### Best designed as a Singleton

You’ll notice that we don’t `new` up this object.

Why is that?

Because it should be designed as a _Singleton_.

What’s a singleton? It’s a type of object where you only ever have one instance of it.

You typically do this using a static method like so:

```tsx
class CompositionRoot {
  private static instance: CompositionRoot | null = null;
  ...
  
	public static createCompositionRoot(config: Config) {
	  if (!CompositionRoot.instance) {
	    CompositionRoot.instance = new this(config);
	  }
	  return CompositionRoot.instance;
	}
  ...
}
```

Why is this important?

Well, you don’t want to accidentally have multiple trees of your application. You don’t accidentally want to be running _two instances_ of everything.

By designing it as a singleton here, if you use the Composition Root pattern from elsewhere multiple times, you’ll get the same instance.

Really key.

### Enables Polymorphic Application Behaviour Based on the Action/Script + Environment

And finally, the main reason why we use it in the first place, is because we gain the ability to do polymorphism at the central **pivot point** — the application composition — the place we create objects and wire everything up.

Where’s the polymorphic behaviour?

Take a look.

For example, later on in “Advanced Testing”, we're going to write _High Value Unit Tests_ and we’ll need to swap out the database for a fake one so we keep our code pure.

For example:

```tsx
private createDBConnection() {
  if(this.shouldBuildFakeRepository()) {
    return new FakeDatabase();
  }
  const dbConnection = new PrismaDatabase();
  if (!this.dbConnection) {
    this.dbConnection = dbConnection;
  }
  return dbConnection;
}

private shouldBuildFakeRepository() {
  return (
    this.config.getScript() === "test:unit" ||
    this.config.getEnvironment() === "development"
  );
}
```

That’s it. That’s the magic.

You don’t have to do this _yet_, but you will.

Don’t under estimate how powerful this pattern is.

## Your Turn!

Boom - now you know how it works.

So go on and set it up now, composing together your application from a new root object.

For the submodule assignment, continue forward once:

✅ You’ve refactored to use a composition root instead

✅ You’re using the composition root in:

- All your tests
- Your bootstrap location for when you run “start” 

## FAQ

### “This looks like it’s going to grow huge!”

Yes, it definitely will. And we’ll talk about this in a couple lessons from this one. But for now, don’t worry. Press on and set it up. We’ll talk about how to modularize it later.

## Summary

- The composition root encapsulates what varies — and what tends to vary is the application composition itself; it gives us the flexibility of dynamic runtime behaviour.
- The two key places we use composition to construct the application are when we run our **tests** and when we **start the application**.
- It’s typically best to design the composition as singletons so we maintain a single composition root at all times.
