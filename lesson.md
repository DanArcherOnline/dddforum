# How to Write High Value Integration Tests 
#subjectVerification #verticalSlicing

_Last updated: Sept 20th, 2024_

_Topics: integration tests, outgoing adapters, polymorphism, composition, sandboxed environments, production instances,_

_Major Topics: Test-Driven Development, Behaviour-Driven Design, Design Patterns_

## Lesson Goals

- _What are high value integration tests & why do we write them?_
- _When should we run them?_
- _How do we set them up?_

## Recap: What & why high value integration?

High value integration tests are exactly the same as high value unit tests, except that they include **real production** instances of **outgoing adapters** instead of test doubles.

You can quickly set up high value integration tests by duplicating your unit test code and adjusting the composition rules.

With just a few lines of code, you can gain a massive amount of confidence in your tests.

That’s the power of polymorphism.

## When to write them

To be quite honest, this might be the **best** type of High Value Acceptance Test you can write (aside from E2E because it covers the most).

It’s a good strategy to use high value unit tests for local development so you can get fast feedback, but nothing beats _real_ production instances.

At the end of the day, it’s always going to be a tradeoff. And it’s always going to be circumstantial.

## How to write them?

If you already have High Value Unit or E2e tests written, this is really straightforward.

We just adjust the composition strategy.

### 1. Duplicate your high value unit → high value integration test

Self explanatory step, but you can basically just copy your registration.unit.ts to a `registration.infra.ts` file.

### 2. Change your composition strategy

What’s different?

Very little.

However, this little line here is important:

```tsx
composition = CompositionRoot
  .createCompositionRoot(new Config('test:infra'));
```

Consider how this might change your application composition at runtime.

You now want to:

- _use the real user repo_
- _use the real transaction api_
- _use the real marketing / contact list api_

Add the correct code in your corresponding modules to make it so.

### **3. Remove communication verification statements, confirming using real user repo and real services interactions.**

Remove the communication verification statements because we’re making real calls to infrastructure.

And if you want to confirm that you’re at the very least _calling_ the right methods, well — that’s what the high value unit tests are for.

The integration tests are for confirming it all actually talks to each other.

Make sure all your tests pass.

## FAQ

### Could we run both HVUTs and HVITs?

Of course. Maybe you run your _high value unit tests_ over and over when you’re doing local development and maybe you run your _high value integration_ tests a few times.

Also, in terms of deployment pipelines, you may create an entire Phase where you _just_ run integration tests after the _Commit Phase_ completes, and before you move on to deploying to staging.

### What about sandbox environments?

If you can access a sandboxed environment for your infrastructure adapters, that’s ideal. If speed doesn’t matter too much to you, and it doesn’t cost you anything to run many tests over and over, sandboxes for the win.

## Your Turn!

**Grading Checklist**

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

## Summary

- High value integration tests are exactly the same as high value unit tests, except that they include **real production** instances of **outgoing adapters** instead of test doubles.
- It’s a good strategy to use high value unit tests for local development so you can get fast feedback, running high value integration every now and then.
- If you have access to sandboxed instances of your outgoing adapters, this may be preferable to writing high value unit tests.
- Yet again, setting up high value integration tests where you already have high value unit or E2e tests is as simple as duplicating the tests and changing the composition strategy.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.