# Building a Commit & Deploy Phase in GitHub Actions 
#deploymentAndDelivery

_Last updated: Sept 20th, 2024_

_Topics: the deploy phase, the commit phase, GitHub Actions, husky, code quality, feedback loop, continuous integration, manual vs. automatic deploys_

_Major Topics: Deployment Pipelines, Architectural Components, Behaviour-Driven Design_

Now that we’ve deployed to Render, it’s time for us to set up the workflow stages necessary to deploy our application. This is a process which can be as long or as short as you want, but one thing is for sure — we want to put our tests to good use. So that’s what we’ll learn how to do here.

## Lesson Goals

In this lesson, we will cover:

- What are GitHub Actions and how can we use them to create a Deployment Pipeline
- The what & why behind setting up Commit & Deploy Phases
- How to set up Commit & Deploy Phases using GitHub Actions

## Using GitHub Actions as a Deployment Pipeline tool

I typically use GitHub as my source code repository.

Well, it turns out that GitHub has an incredible feature called GitHub Actions, which gives you the ability to **automate workflows** (such as your Continuous Integration/Continuous Deployment) pipelines, directly within your GitHub repository.

How?

Through something GitHub actions calls **jobs**.

We can set up phases for whatever we like… and we do so using YAML files (stored in your project’s `.github/workflows/`), defining the specific steps and conditions for each phase of the pipeline.

And the first of those phases will be for testing our _Unit Tests._

## The phases

### The Commit Phase

According to Continuous Delivery pioneer, Dave Farley, after you commit your code to GitHub, the **Commit Phase** kicks off and runs a series of scripts:

- _lint (and fail if critical errors occur)_
- _build (and fail if any errors occur)_
- _unit test (and fail if any errors occur)_

This is the place where, if you’ve invested considerable amounts of effort into your high value unit tests, they’d pay off in dividends. Without advancing further into the pipeline, you’ll get fast feedback on code quality.

Turning off auto-deploys, we’ll kick off the pipeline using GitHub Actions; from here, we can begin to catch and mitigate negative value before it makes it further down the pipeline.

### The Deploy Phase

### Building a Deployment phase in GitHub Actions

In practice, it’s customary to have at least **two duplicate environments**. A staging environment and a production environment.

Why?

So that when things inevitably go wrong, you have a **staging environment** to catch the blunders before they make it into production.

That means the next phase you’ll setup is the _Deployment (staging)_ phase.

In practice, you want to use GitHub Actions to automatically deploy the code to a staging environment for further testing or directly to production, depending on your setup.

This can include steps such as containerizing the application (using Docker), deploying to cloud platforms (AWS, GCP, Heroku), or orchestrating infrastructure tools like Kubernetes.

We will keep it simple and merely trigger a built to Render.

## 1. (optional) Getting started w/ an optional pre-commit phase checks using Husky

I didn’t mention this before, but a logical first step is to insert a feedback loop before we even commit our code to source control. Husky is a great tool we can use for this. We’ll **lint** and **run the unit tests** before we commit.

This step is optional.

### **1.1 Set up husky & linting**

At the root of your project, where the main package.json is, we’ll run:

_package.json_

```tsx
npm install --save-dev husky eslint
```

Also in the same package.json, let’s add a lint script so we can lint from the root directory.

_package.json_

```json
"scripts": {
  "lint": "npm run lint --workspaces --if-present",
}
```

Install linting packages (e.g., ESLint) if you haven't already, and create a lint script in your package.json:

_projects/backend/package.json_

```json
"scripts": {
  "lint": "eslint --ext .js,.jsx --ignore-path .gitignore ."
}
```

### **1.2 Set up pre-commit linting and unit testing script**

And now, add the husky config to run the pre-commit script before you commit.

_projects/backend/package.json_

```json
"husky": {
	"hooks": {
		"pre-commit": "npm run test:unit && npm run lint"
	}
}
```

Great, that’s one small step towards reducing the potential surface area for errors.

## 2. Setting up the Commit Phase

### **2.1 Turn off auto-deploy**.

The auto deploys are great, but because we’re setting up a pipeline, you want to turn those off.

Head into Render and turn this setting to “No”.

### **2.2 Create a Commit Phase GitHub Action**

Workflow scripts need to live in **.github/workflows/SCRIPT_NAME.yml**.

_.github/workflows/1-best-practices-assignment-commit.yml_

```yaml
name: Best Practices Assignment - Commit Phase

on:
  workflow_dispatch:
  push:
    paths:
      - "ThePhasesOfCraftship/2_best_practice_first/deployment/assignment/end/**"
    branches:
      - main # or specify your desired branch

env:
  PROJECT_PATH: "ThePhasesOfCraftship/2_best_practice_first/deployment/assignment/end"

jobs:
  lint-build-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16.16

      - name: Install
        run: npm ci
        working-directory: ${{ env.PROJECT_PATH }}

      - name: Lint
        run: npm run lint
        working-directory: ${{ env.PROJECT_PATH }}

      - name: Build
        run: npm run build
        working-directory: ${{ env.PROJECT_PATH }}

      - name: Test (core unit tests)
        run: npm run test:unit
        working-directory: ${{ env.PROJECT_PATH }}

```

Lint, build, test.

If successful, you should bee able to see your project build in this first stage.

## 3. The deploy to (to staging) Phase

Next, we’ll write the GitHub Action to deploy to a “staging” environment.

I won’t make you create an additional environment. We’ll just call the environment you’re currently using a _staging_ environment.

### **3.1 Write the GitHub Action.** Using [this community action](https://github.com/marketplace/actions/render-deploy-action) to deploy to render, we’ll set it up to deploy the staging.

To get the service ID, look for the deploy URL and copy the text that starts with `srv-`

Next, set up your GitHub Action.

_.github/workflows/2-best-practices-assignment-deploy.yml_

```yaml
name: Best Practices Assignment - Automatically Deploy to Staging

on:
  workflow_run:
    workflows: ["Best Practices Assignment - Commit Phase"]
    types:
      - completed

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: srv-cpvcjehu0jms73apojq0
          api-key: ${{ secrets.RENDER_TOKEN }}
```

### **3.2 Set up repository secrets in GitHub**.

Finally, set up your RENDER_TOKEN in GitHub via the deployment secrets.

### **3.3 Watch it pass**

And now, make a commit and watch it pass! You should see

Nicely done, my friend.

## Your Turn!

**(optional) Minimal Pipeline: Pre-Commit Phase (local)**

- 🔘 (optional) _I have confirmed I’m using husky hooks to lint before committing_
- 🔘 (optional) _I have confirmed I’m using added husky hooks to run the high value unit tests before pushing_

**Minimal Pipeline: Commit Phase**

- 🔘 _I have created a commit stage pipeline in GitHub actions that runs all of my high value unit tests_
- 🔘 _I have confirmed that my commit stage both runs the lint and the unit test scripts_

**Minimal Pipeline: Deployment to services**

- 🔘 _I have created a deploy phase in my GitHub Actions which deploys the frontend to Netlify or Render and the backend to Render_
- 🔘 _I have confirmed my deploy phase runs after my commit phase_

## Summary

- GitHub actions are an excellent way to set up phases in your minimum deployment pipeline.
- The commit phase can give you a ton of confidence in your code in a fast feedback loop by linting, building, and running your high value unit tests
- The deploy phase is about deploying (either to staging or production); it comes after the commit phase, which can be enabled sequentially by turning off automatic deploys in your deployment platform.
- You can optionally add pre-commit checks using a tool like Husky to run many of the same commit phase actions on your local machine before pushing your code to GitHub.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.