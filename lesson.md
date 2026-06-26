# Setting up Docker For Local Development 
#deploymentAndDelivery

_Last updated: Sept 20th, 2024_

_Topics: docker, DevOps, development environments, “automate nearly everything”, encapsulate what varies, port mapping, containers, images_

_Major Topics: Deployment Pipelines, Architectural Components_

## Lesson Goals

- What’s the problem with our local development efforts & how do we fix it?
- What is Docker & what do I need to know about it?
- How to set up Docker for local development purposes

## Where are we so far?

We’re getting ready to deploy and set up some tests in the deployment pipeline.

That means we’re nearly done with all the `development` environment work and we’re going to focus on doing work in the `ci` , `testing` (also known as `staging`) and `production` environments.

That means we’re going to deploy our code to real production environments with real databases and services.

But we’ve got a problem.

### Migrating to Docker for local development

Until now, we’ve been using _sqlite_ for all of our tests.

That’s been great and all — it’s made it real easy for us to learn how to write tests locally, but in reality, this is not the way to go.

In reality, we want to test against the most **production-like environment as possible**.

Why?

Again, parity.

The closer the `test`, `development` and `production` environments look and feel, the more certainty you have.

Not only that, but we’ve **actually run into an impasse**.

In fact, if you’ve been using Prisma so far, it turns out that they’ve done us solid in preventing some serious foot-cannonry by **constraining your database provider to a single option**.

What does this mean?

It means if you’re using _sqlite_ in `development`, you gotta use _sqlite_ in `production` as well.

If you’re using _postgres_ in `production`, you’ve gotta use _postgres_ in `development` as well.

It means that we **won’t actually be able to deploy or test against a real production database like postgres unless we fix this config**.

This is actually **good**. This is a **best practice**.

The last thing you want is to write integration tests, execute them locally, have everything go fine, and then when you run against a different type of database in production, things go awry.

You don’t want the inconsistency.

So for this reason, we’re going to switch to Postgres locally.

### Should I install Postgres manually?

> “But it works on _my_ machine! I don’t know why it’s not working on _yours_.”

Typically, before we get into this world of containers, we just install the services we need manually, directly to our local machines.

_Just pulled the company code for a new job you started working at? Said you need to have elasticsearch, redis, and postgres installed? “No worries, I’ll just install those using brew or download them from the internet”, you say?_

Probably not the best idea.

Why? Again, systems thinking.

Your local machine is an entire environment in and of itself. And the environment affects the model which it contains (and in this case, we’re referring to your application and all of the services it requires).

The problem is that there is a lot of variance in this system-model-environment setup:

- **configuration**. who knows what sorts of configurations (or lack of configuration) you’ve got going on within your machine…
- **service versioning**. who knows what version of postgres, redit, MySQL or whatever other required services we should be using…
- **operating system.** who knows what operating system the original author(s) of the codebase were using to create the application…

So if you run into a lot of “it’s not working on my machine” problems, the reason is because you haven’t found a way to **stabilize the environment**.

You haven’t **encapsulated** the application (which includes the services) properly.

We gotta lock things down if we want consistency.

This is where Docker comes in.

## The 4 keys of Docker

I’ll admit that I resisted Docker for a long time, but honestly — it’s a tremendous tool with a lot of use cases.

In essence, here are the 4 main things you need to know.

### 1. It’s a platform of “images”

**Docker** is a platform that allows you to create, deploy, and run applications in lightweight, isolated environments called containers, which are consistent across various systems.

### 2. “Images” are stabilized environments with predictable behaviour

**Images** are snapshots or blueprints used to create containers; they contain the instructions for what a container should include and how it should behave.

You can get images for:

- _**databases**_
- _**services**_
- _**web servers**_
- _**applications**_

Basically, a Docker container is an isolated environment running on a shared Linux kernel, which you can configure with any software you need, and then turn into an image to reproduce it repeatedly.

Sometimes that means just installing _**postgres**_ onto it and then turning it into an image, and then pulling it over and over, so you can do so in a reproducible way.

Or maybe it’s one of your web apps. Maybe you want to package your backend into an image so that your frontend team can just easily point to it on their local machine to do their frontend work against.

### 3. You run images as “containers” on your machine

**PostgreSQL in Docker** can be run as a container, which means you don't have to manually install or configure the database on your system; you simply pull an official PostgreSQL image and run it as a container.

And that’s what we’ll do!

### 4. You can “automate your infrastructure” with Docker

This is a powerful approach.

**Using Docker for local databases** allows you to easily start, stop, and remove databases without affecting your system, giving you a clean, isolated development environment that’s fast to spin up and tear down.

So that’s what we’ll do.

## How to set up Docker & a Dockerized Postgres Instance

Let’s switch to a local dockerized Postgres instance.

### 1. Get setup

1. (If you haven't already) [clone the template to your GitHub and download it to your machine](https://github.com/stemmlerjs/the-software-essentialist)
2. Go to the project folder for this assignment (head [here](https://github.com/stemmlerjs/the-software-essentialist/tree/main/ThePhasesOfCraftship/2_best_practice_first/strategicDesignPart1/exercises/1_RefactoringTo4Tiers) to see it on GitHub).
3. npm install
4. You’ll want to use the **main branch** for this one because we’ll be dealing with GitHub Actions
5. Get started in the _start_ folder

### **2. Install docker desktop**.

You can download Docker Desktop [here](https://www.docker.com/products/docker-desktop/).

Install this on your machine and then start it up.

### **3. Create a docker compose w/ script**

Next you’ll create a docker compose file with the target of generating a local postgres container.

_packages/backend/docker-compose.yml_

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:latest
    container_name: development-postgres
    ports:
      # Explanation: Port 5000 on my machine will point to postgres 
      # running inside the container
      - "5000:5432"
    environment:
      POSTGRES_DB: dddforum
      POSTGRES_USER: dddforum_user
      POSTGRES_PASSWORD: dddforum_password
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  pg-data:
    driver: local
```

Allow me to explain what’s going on here:

- **version**: This is the docker compose file format. We’re using a relatively recent version, which gives us the main Docker features.
    
- **services**: This is where we explain the containers we want to run. In this case, only one: **postgres**.
    
- **postgres:** This is the name of the service (container). It's using **Postgres** as the database.
    
    Inside the `postgres` service:
    
    - **`image: postgres:latest`**: Specifies that the latest version of the official Postgres image will be pulled from Docker Hub to create the container.
        
    - **`container_name: development-postgres`:** This sets a custom name for the container. Instead of a random name, it will always be called `development-postgres`.
        
    - **`ports:`**
        
        This section defines how the container ports are mapped to the host machine.
        
        - `"5000:5432"`:This maps port **5432** (the default Postgres port inside the container) to port **5000** on your local machine.
            - So when you access `localhost:5000` on your machine, it will connect to Postgres running inside the container on port **5432**.
    - **`environment:`**
        
        Environment variables for Postgres are set here:
        
        - `POSTGRES_DB: dddforum`:Creates a database named **`dddforum`**.
        - `POSTGRES_USER: dddforum_user`:Sets the username to **`dddforum_user`**.
        - `POSTGRES_PASSWORD: dddforum_password`:Sets the password to **`dddforum_password`**.
    - **`volumes:`**
        
        Volumes allow you to persist data across container restarts. In this case, you have a named volume (`pg-data`), which maps to the Postgres data directory inside the container.
        
        - **`pg-data:/var/lib/postgresql/data`**: This binds the **pg-data** volume (defined below) to the folder inside the container where Postgres stores its data (`/var/lib/postgresql/data`).
- `volumes:`This defines named volumes that are shared between your host machine and the container. Named volumes allow persistent storage, even if the container is deleted.
    
    - **`pg-data:`**
        
        This is the volume that will store the Postgres database files. It uses the **local** driver (which is the default) to store data on the host machine in a specific location.
        
    - **`driver: local`**:
        
        Specifies the storage driver as **local**, meaning the data will be saved on your local machine’s filesystem.
        

Overall, we create a named container (`development-postgres`) running the latest version of Postgres. We then map the container's port **5432** to port **5000** on your local machine for easy access, and a persistent volume (`pg-data`) to save the database data locally so that it’s not lost if the container is removed.

### 4. Update your environment variables, scripts & configuration

You’ll also need to update your environment variables for development.

_backend/.env.development_

```bash
DATABASE_URL=postgresql://dddforum_user:dddforum_password@localhost:5000/dddforum
NODE_ENV=development
```

To make it easy to repeatedly start your database, add a script to your package.json like so.

_packages/backend/package.json_

```json
"test:e2e": "jest -c jest.config.e2e.ts",
"start:db:dev": "docker-compose up -d"
```

And finally, you’ll switch from _sqlite_ to _postgres_ in your prisma config.

packages/backend/prisma/schema.prisma

```yaml
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### **5. Run your tests to confirm**.

You want to confirm that when you run your tests — all of them — that they all still work and the E2E and integration tests make use of your postgres database still. You’ll have to re-seed and re-migrate to get set up with your new database.

## FAQ

### What’s the difference between Docker and Docker Compose?

**Docker** itself is used to manage individual containers. We typically do this one at a time by creating, running, and stopping single instances. Basically, it’s command-line usage.

**Docker Compose**, however, is the tool that you’ll more likely be using because it gives you the ability to define and manage **multi-container** Docker applications using a YAML file to configure multiple services (e.g., a web app and its database) that work together.

In other words, **Docker** focuses on running one container at a time, while **Docker Compose** simplifies the process of managing and orchestrating multiple interconnected containers.

With **Docker**, you manually start each container with individual `docker run` commands, but **Docker Compose** allows you to start all related containers (e.g., backend, frontend, database) simultaneously with `docker-compose up`.

Admittedly, we’re only using a single service right now… and we **will not** be _containerizing_ our application (when you turn your backend or frontend into a container).

Instead, what we’re really get out of Docker Compose is the ability to declare what we want in a declarative way.

## Your Turn!

**Dockerized local dev & testing environment**

- ✅ _I have set up Docker & Docker Compose on my machine_
- ✅ _I have switched my prisma config to use the postgres docker container instance instead_
- ✅ _I have confirmed that my application uses a postgres docker container in both dev and test mode_
- ✅ _I have confirmed that my e2e tests in dev run against a test docker postgres instance_
- ✅ _I have confirmed that my e2e tests in test mode run against a docker postgres instance_
- ✅ _I have confirmed that my e2e tests for frontend and backend both still work_
- ✅ _I have confirmed that all of my high value integration tests also work_

## Summary

- Docker is a platform where you can create consistent and reproducible environments, services, applications avoiding issues with configuration, service versions, and operating systems.
- We switch from SQLite to Postgres for local development to ensure parity between development and production environments; it’s a good practice and often, our tools won’t enable us to do anything different.
- To set up Postgres locally without installing it manually, we use Docker Compose, which enables us to document the service using YAML files.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.