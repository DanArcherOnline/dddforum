# Build a Test Phase in GitHub Actions 
#deploymentAndDelivery #subjectVerification

_Last updated: Sept 20th, 2024_

_Topics: Test Phase, Acceptance Testing, staging environment_

_Major Topics: Deployment Pipelines, Architectural Components, Behaviour-Driven Design_

In the real world, you want to deploy to both **staging** and **production**, making sure that you run acceptance tests against your staging environment before you either automatically or manually deploy to production. In this lesson, we’re going to add one final phase — the **acceptance test phase** which treats your deploy as a staged environment and tests your deployment.

## Lesson Goals

In this short lesson, we’ll quickly cover:

- What is the test phase and what do we run in it?
- How to set it up?

## About the (acceptance) phase

Finally, we’ll set up a testing phase to put your E2e acceptance tests to good use.

These tests run against your staging environment once the **staging deploy** phase successfully finishes.

While we won’t do it here, the next phases would either involve a manual or automatic deploy to a production environment.

The beauty is: you can always add more phases afterwards or in-between to gain more and more confidence (security, integration, performance, etc)

### Aren’t we wasting money with duplicated environments?

How much is safety worth to you? How much is it worth to notice a migration going wrong in your **staging environment** before it hits your **production** environment.

This is a **defensive use of money**.

And that’s the weird thing about this game of software development. Everything is truly a guess. We don’t know until we experience. So this environment exists to experience first.

Consider _wasting money_. This is how it works. You set up multiple feedback loops. You have a test environment that is almost completely the same as your production environment.

## Setting up the (acceptance) test phase

This should be relatively straightforward because all you’re doing is adding an extra phase.

### 1. **Write github actions script**.

You should already have your staging DATABASE_URL handy, but put it into GitHub as a secret now.

Then write your final GitHub Actions script.

_.github/workflows/3-best-practices-assignment-testing.yml_

```yaml
name: Best Practices Assignment - Testing on Staging

on:
  workflow_run:
    workflows:
      [
        "Best Practices Assignment - Automatically Deploy to Staging and Production",
      ]
    types:
      - completed

env:
  NODE_ENV: staging
  PROJECT_PATH: "ThePhasesOfCraftship/2_best_practice_first/deployment/assignment/end"
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

jobs:
  test:
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

      - name: Wait for 300 seconds
        run: sleep 300s
        shell: bash

      - name: Test (core e2e tests)
        run: npm run test:staging
        working-directory: ${{ env.PROJECT_PATH }}
```

Expect to debug lower level scripts until you get these to converge.

Once you’re done, congratulations! You’ve just set up a minimal deployment pipeline — one you can always continue to improve and add onto.

Nice work.

## Your Turn!

- 🔘 _I have created a test phase in my GitHub Actions which runs the e2e acceptance tests against the staging environment_
    - 🔘 _I have confirmed that my ui e2e tests pass_
    - 🔘 _I have confirmed that my backend e2e tests pass_

## Summary

- The (acceptance) test phase enables you to validate that your application works in staging.
- Your staging environment is a replica of your production environment.
- The cost of a duplicate environment can be justified by the surface area of protection you gain against rolling out broken features, configurations, migrations, and so on — fixing those problems sooner rather than later in production.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.