# Outgoing Adapter (Contract) Tests Revisited 
#subjectVerification

_Last updated: Sept 20th, 2024_

_Topics: contract tests, outgoing adapters, ports, test parity, test transitivity_

_Major Topics: Test-Driven Development, Behaviour-Driven Design, Design Patterns_

Now that we’ve written all of the _High Value Unit_ tests, let me show you how to improve your outgoing adapter tests. Used in combination with your High Value Unit Tests, you activate the power of **Test Transitivity** and **Test Parity**.

## Lesson Goals

- _What are outgoing adapter tests & why do we write them?_
- _How do you write them?_

## What’s the problem w/ High Value Unit Tests?

The biggest problem is that we make use of test doubles instead of real infrastructure, you trade confidence and certainty for speed.

We’ve already talked about this — but, if you’re using fake or in memory instances in development, who is to say the **real instance** will work in production?

We just don’t know.

To handle this, you have two options:

1. Refactor to **High Value Integration Tests** instead (coming next)
2. or combine your High Value Unit Tests with **Outgoing Adapter (Contract) Tests**.

## Recap: What’s an outgoing adapter (contract) test?

Outgoing Adapter (contract) tests are tests that verify connections to external, outgoing infrastructure such as databases, caches, APIs, so on.

You can run these independently against a single adapter or you can run them against multiple adapter implementations simultaneously.

## What’s so special about these?

Just like every other test, what you get out of this is **focus**. That’s what **Subject Verification** is all about. It’s about the ability to focus in on one specific aspect of the problem that you’re trying to solve.

But uniquely, with these contract tests, you actually use the principle of **transitivity**.

Here’s how it works:

- Using the formula of **transitivity**, which states if **A < B** and **B < C** then we can assume that **A < C**, we can set up testing strategies which make the following claims:
    - If we use **test doubles** to stand in for **production instances** in the **high value unit tests**…
    - … and the **test doubles implement the same contract** as the **production instances**…
    - **...**then if our **test doubles** successfully pass while running alongside the **production instances** in the contract tests…
    - … then, so long as we run both the **high value unit tests** AND the **outgoing contract tests**, we can assume that the **test doubles** in the **high value unit tests** are safe.

Said differently, test-production-code parity is really important. If we use test doubles in development, these help us know if our production implementations will work as well.

Now let’s improve our existing outgoing contract tests.

This should be very easy.

## How to improve your outgoing contract tests

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

**7.2 Confirm it works, you now have production-test-code parity.**

Recall that this is the dynamic we’re working with.

So long as both of your tests (high value unit + contract) work, you can rest easy that your test doubles are not robbing you of the confidence you need in your codebase.

## Your Turn!

**Grading Checklist**

_For my UserRepo contract test, both the production and test implementations of a UserRepo have the following:_

- ✅ _can successfully ‘save’ & retrieve an item_
- ✅ _can ‘getAllUsers’ has at least one success & one failure case_
- ✅ _can ‘getByEmail’ has at least one success & one failure case_
- ✅ _can ‘getByUsername’ has at least one success & one failure case_

## Summary

- Outgoing adapter tests verify that outgoing adapters work properly.
- While useful independently, they are perhaps most useful when combined with high value unit tests due to their ability to provide us with **test-production-code-parity** by verifying all of the outgoing adapters in unison.

If you have any questions or suggestions to improve this lesson, leave a comment below.

As always, To Mastery.