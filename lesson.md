# How to Get E2e Type Safety w/ a Shared Kernel + API Client

_Last updated: August 29th, 2024_

_Topics: apiClients, type safety, composing types, generics (polymorphism), developer experience_

_Major Topics: Design patterns, architectural patterns_

Vision. “How will this feel? What will it look like by the end?”

There’s a reason why we start with Vision. In fact, indirectly, it was one of the most important things I learned as a Developer Advocate at Apollo GraphQL.

If you want end to end type safety — if you’re designing the contract for your API, the place to start is **user experience** and the **developer experience**. You’ve got to see it first, feel it first.

Where are we? Well, we’re mostly done with the backend in this submodule.

To wrap up, let’s take a final pass through from front to back.

## Lesson goals

In this lesson, we’ll cover:

- the type layer and how to design it using a mixture of UX and DX
- why I recommend using an API client

## Revisiting the frontend

We haven’t seen the frontend in a while. Let’s take a look at the way we’d connected to the backend, most likely.

Here’s the registration page.

_pages/registrationPage.ts_

```tsx

import { Layout } from "../components/layout";
import {
  RegistrationForm,
  RegistrationInput,
} from "../components/registrationForm";
import { ToastContainer, toast } from 'react-toastify';
import { api } from "../api";
import { useUser } from "../contexts/userContext";
import { useNavigate } from "react-router-dom";
import { useSpinner } from "../contexts/spinnerContext";
import { OverlaySpinner } from "../components/overlaySpinner";

type ValidationResult = {
  success: boolean;
  errorMessage?: string;
}

function validateForm (input: RegistrationInput): ValidationResult {
  if (input.email.indexOf('@') === -1) return { success: false, errorMessage: "Email invalid" };
  if (input.username.length < 2) return { success: false, errorMessage: "Username invalid" };
  return { success: true }
}

export const RegisterPage = () => {
  const { setUser } = useUser();
  const navigate = useNavigate()
  const spinner = useSpinner();

  const handleSubmitRegistrationForm = async (input: RegistrationInput) => {
    // Validate the form
    const validationResult = validateForm(input);

    // If the form is invalid
    if (!validationResult.success) {
      // Show an error toast (for invalid input)
      return toast.error(validationResult.errorMessage);
    }

    // If the form is valid
    // Start loading spinner
    spinner.activate();
    try {
      // Make API call
      const response = await axios.post('<http://localhost:3000/users/new>', {
	      ...input
	    })
      // Save the user details to the cache
      setUser(response.data.data);
      // Stop the loading spinner
      spinner.deactivate();
      // Show the toast
      toast('Success! Redirecting home.')
      // In 3 seconds, redirect to the main page
      setTimeout(() => { navigate('/') }, 3000)
    } catch (err) {
      // If the call failed
      // Stop the spinner
      spinner.deactivate();
      // Show the toast (for unknown error)
      return toast.error('Some backend error occurred');
    }

  };

  return (
    <Layout>
      <ToastContainer/>
      <RegistrationForm
        onSubmit={(input: RegistrationInput) =>
          handleSubmitRegistrationForm(input)
        }
      />
      <OverlaySpinner isActive={spinner.spinner?.isActive}/>
    </Layout>
  );
};
```

What could be improved here?

- **failure scenarios**: Big boo-boo here is that we’re not handling any of the failure scenarios with specificity. As you know, it could fail because _UserAlreadyExists_ or _UsernameTaken_ or _InvalidInput_. Instead, we’re just throwing an error.
- **hard-coded URL**. We’re also hard-coding the url for the endpoint. What happens when we want to shift to production? Or even just our staging environment?
- **brittleness due to the lack of strict types**: Without types (or tests), we might not be certain that this code will continue to work as the backend evolves. That’s a big problem.

What to do?

Two things: types & api clients.

Let’s start with the types. We want to introduce a type layer. We’ve sorta been dancing around it a fair amount actually.

## The Type Layer: What & Why?

### What is the type layer?

Okay, so what do I mean by a _type layer_?

Well, continuing forward again with Horizontal Decoupling, the _type layer_ is basically the DTO layer.

It’s the layer that the frontend knows about, and the layer that the backend fulfills.

It’s the **contract** layer between the frontend and then backend.

“Wait, so then how is that different from what we’ve been doing?”

You may have noticed a little bit of **conflation** between what we call DTOs, commands, queries & types.

For example, what’s the difference between these?

- _CreateUserInput_
- _CreateUserCommand_
- _UserDTO (ie: { user, email, firstName, lastName } )_
- _CreateUserResponse_
- _User (model structure from Prisma)_

There’s a huge difference between all of these things. And it’s big error to not give these concepts the attention and decoupling they deserve. We sometimes end up using the wrong abstraction in builders, in our tests, and all over the place if we’re unclear.

Let’s break down the architecture here.

So what we’re seeing is this:

- **the type layer** includes the **input, response,** and the **structure of the objects** within that response.
- **a response** is polymorphic in the sense that it can take the shape of a successful response (_CreateUserSuccess_) or a failure (_UserAlreadyExists, UsernameTaken, InvalidInput, ApplicationError_). We will see how to model this shortly.
- **a command** is a **validated** object. When we transform data from a Request object into an input DTO, it’s unvalidated. The role of the **command object** is to validate the DTO. The command object is then passed to an application service method (also known as a _Use Case_).

  Think of it like:

  _InputDTO → (network) → UnvalidatedInputDTO → ValidatedCommand → Use Case/Service Method_

  As a note: as we pass through Pattern-First, with a better understanding of the flow of data and types, you notice that this is just how it works. Data merely **transforms** and passes through systems, with very little statefulness required if done correctly (ie: the Functional Core-Reactive Shell architectural pattern). This functional decomposition of types is exactly the sort of thing Scott Wlaschin advocates in his excellent “_Domain-Driven Design Made Functional_” book, which is a recommended Pattern-First read.

### Why do we need it?

Alright cool, so that’s the type layer.

And why do we need this?

Hopefully you’re starting to see it. Besides just being an important part of the problem decomposition process, here are a few major benefits:

- **Stabilizes the API.** When developers have psychological safety, to know they can rely on the content returned from an API call, that frees them up to focus on other things AND write more complete code as a result. You actually **handle** the failure cases instead of nebulously throwing errors.
- **Frontend and backend teams can work independently without fear of affecting each other.** For example, say you’re working on a frontend feature but the API from the backend team isn’t ready yet. How do you start your work? You get the type layer figured out first, and then you can work against that, knowing that it will **eventually** be fulfilled by the backend team. Can you see how this is **dependency inversion** at the **team level**?

### How do you design it?

“That’s pretty cool but how do you design it?”

Start from the outside-in. The best way to design the type layer is to **start from the user experience**. That’s the highest level possible. It helps you see exactly what you’ll need.

Personally, my favourite way to learn the data requirements from the user experience is Event Storming. It helps you actually connect the **types** and the **commands** together.

This is a bit of an involved process, however. There are faster ways of getting the types.

You can focus on a mixture of DX and UX from React.

## Designing the type layer

Let’s come back to the registration feature.

### 1. Starting w/ the UX & DX

The requirements here are to handle the input for the form and to:

- _show a success message and redirect the user to the main page if successful_
- _show a failure message if not successful_

That’s it, basically.

Now, let’s use my favourite practices — programming by wishful thinking. What _could_ work?

```tsx

  const handleSubmitRegistrationForm = async (input: RegistrationInput) => {
    // Validate the form
    const validationResult = validateForm(input);

    // If the form is invalid
    if (!validationResult.success) {
      // Show an error toast (for invalid input)
      return toast.error(validationResult.errorMessage);
    }

    // If the form is valid
    // Start loading spinner
    spinner.activate();
    try {
      // Make API call
      const response = await axios.post('<http://localhost:3000/users/new>', {
	      ...input
	    })
      if (!response.success) {
        switch (response.error.code){
          case 'EmailAlreadyInUse':
            return toast.error('This email is already in use. Perhaps you want to log in?');
          case 'UsernameAlreadyTaken':
            return toast.error('Please try a different username, this one is already taken.');
          case 'ValidationError':
            // We could further improve this with more 
            // refined types to specify which 
            // form field was invalid.
            return toast.error(response.error.message);
          case "ServerError":
          default:
            return toast.error('Some backend error occurred');
        }
      }

      setUser(response.data);
      // Stop the loading spinner
      spinner.deactivate();
      // Show the toast
      toast('Success! Redirecting home.')
      // In 3 seconds, redirect to the main page
      setTimeout(() => { navigate('/') }, 3000)
    } catch (err) {
      // If the call failed
      // Stop the spinner
      spinner.deactivate();
      // Show the toast (for unknown error)
      return toast.error('Some backend error occurred');
    }
  };
```

Yeah, I like that design.

Let’s make it real.

### 2. Defining the types & responses

In our **shared** folder, let’s create an _api_ file and start to define some types for API calls themselves.

_shared/src/api.ts_

```tsx
export type Error<U> = {
  message?: string;
  code?: U;
};

export type APIResponse<T, U> = {
  success: boolean;
  data: T;
  error: Error<U>;
};

export type ValidationError = "ValidationError";
export type ServerError = "ServerError";
export type GenericErrors = ValidationError | ServerError;
```

What you’re looking at here is the foundational shape for all of the requests we’ll make to the server.

Here’s what’s going on here:

- **APIResponse\<T, U>**: We’re using generics! If you haven’t seen this before, it’s a tremendous way for us to utilize polymorphism. The T and the U represent _placeholder types_ that we’ll fill in with real types. You’ll see how this works in a moment. But ultimately, all of our API responses will take this shape.
- **Error**: We need a way to code the different error responses, like _AlreadyExists_ and _UsernameTaken_. Well, this is a good way to do it.

A success response might look like:

```tsx
{
  success: true,
  data: {
    username: 'johnnybob',
    email: 'johnnybob@gmail.com',
    firstName: 'johnny'
    lastName: 'bob'
  },
  error: {}
}
```

A failure response might look like:

```tsx
{
  success: false,
  data: {}
  error: {    message: 'This user already exists!',    code: 'UsernameAlreadyExists'
  }
}
```

And then let’s define the other types.

```tsx
import axios from "axios";
import { APIResponse, GenericErrors, ServerError } from ".";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type EmailAlreadyInUseError = "EmailAlreadyInUse";
export type UsernameAlreadyTakenError = "UsernameAlreadyTaken";
export type CreateUserErrors =
  | GenericErrors
  | EmailAlreadyInUseError
  | UsernameAlreadyTakenError;
export type CreateUserResponse = APIResponse<User, CreateUserErrors>;
```

Not bad.

Give this a shot! You might have to question and clean up some existing types you’ve got laying around.

## Using an API Client

But what about the hard-coded API call?

Yes, that’s when we can use an **APIClient**.

**What is this?** It’s a **shared** object between the backend and the frontend, where you

show an image

**Why?** The first reason is **Encapsulation**.

- much nicer user experience
- we can encapsulate the implementation details (URL, actual api call structure). This is important because if we ever have to update the API calls, there’s only one place we do it.

Let’s see what this looks like.

### 1. Building the apiClient

Thinking about the design, I’d like to use it like this.

```tsx
const response = await api.users.register(input);
```

Much nicer.

And then let’s build it.

_shared/src/api.ts_

```tsx
export const createUsersAPI = (apiURL: string) => {
  return {
    register: async (input: CreateUserInput): Promise<CreateUserResponse> => {
      try {
        const successResponse = await axios.post(`${apiURL}/users/new`, {
          ...input,
        });
        return successResponse.data as CreateUserResponse;
      } catch (err) {
        //@ts-ignore
        return err.response.data as CreateUserResponse;
      }
    },
    getUserByEmail: async (email: string): Promise<GetUserByEmailResponse> => {
      try {
        const successResponse = await axios.get(`${apiURL}/users/${email}`);
        return successResponse.data as GetUserByEmailResponse;
      } catch (err) {
        //@ts-ignore
        return err.response.data as GetUserByEmailResponse;
      }
    },
  };
};
```

By the end, our code should look something like this.

```tsx
const handleSubmitRegistrationForm = async (input: RegistrationInput) => {
  // Validate the form
  const validationResult = validateForm(input);

  // If the form is invalid
  if (!validationResult.success) {
    // Show an error toast (for invalid input)
    return toast.error(validationResult.errorMessage);
  }

  // If the form is valid
  // Start loading spinner
  spinner.activate();
  try {
    // Make API call
    const response = await api.users.register(input);
    if (!response.success) {
      switch (response.error.code){
        case 'EmailAlreadyInUse':
          return toast.error('This email is already in use. Perhaps you want to log in?');
        case 'UsernameAlreadyTaken':
          return toast.error('Please try a different username, this one is already taken.');
        case 'ValidationError':
          // We could further improve this with more refined types 
          // to specify which form field was invalid.
          return toast.error(response.error.message);
        case "ServerError":
        default:
          return toast.error('Some backend error occurred');
      }
    }

    setUser(response.data);
    // Stop the loading spinner
    spinner.deactivate();
    // Show the toast
    toast('Success! Redirecting home.')
    // In 3 seconds, redirect to the main page
    setTimeout(() => { navigate('/') }, 3000)
  } catch (err) {
    // If the call failed
    // Stop the spinner
    spinner.deactivate();
    // Show the toast (for unknown error)
    return toast.error('Some backend error occurred');
  }
};
```

### 2. Updating the tests

Lastly, we can update the way our tests work to use the apiClient instead. Why?

**Synchronization**.

- Your UI tests on the frontend will verify your frontend and backend, using the APIClient.
- Your backend tests use the apiClient!

So, as long as the api client is up to date, you know that things work end to end!

That’s awesome.

For reference, here’s what the one of our tests might look like after the change.

```tsx
when('I register with valid account details accepting marketing emails', async () => {
  response = await apiClient.users.register(user);
  addEmailToListResponse = await apiClient.marketing.addEmailToList(user.email);
});
then('I should be granted access to my account', async () => {
  const { data, success, error } = response;

  // Expect a successful response (Result Verification)
  expect(success).toBeTruthy();
  expect(error).toEqual({});
  expect(data!.id).toBeDefined();
  expect(data!.email).toEqual(user.email);
  expect(data!.firstName).toEqual(user.firstName);
  expect(data!.lastName).toEqual(user.lastName);
  expect(data!.username).toEqual(user.username);

  // And the user exists (State Verification)
  const getUserResponse = await apiClient.users.getUserByEmail(user.email);
  const {data: getUserData} = getUserResponse;
  expect(user.email).toEqual(getUserData!.email);
});

and('I should expect to receive marketing emails', () => {
  const { success } = addEmailToListRespons
  expect(success).toBeTruthy();
});
```

Much nicer API. Much higher stability.

Great!

## Your Turn!

To wrap up this submodule, let’s get your E2E types set up.

Here’s what to do.

For the submodule assignment, continue forward once:

✅  Update all calls on the frontend to use an APIClient

✅  Ensure each API call is strictly typed, where types are defined in an api file in the shared folder

✅  Update your backend E2E tests to use the APIClient instead

With all that done, it’s time for us to take a look at your code.

Go ahead and submit to #the-feedback-loop!

## Summary

- a type layer stabilizes your API and improves the DX
- derive your type layer from the UX and prioritize DX as you do so, working outside-in layer by layer
- use an APIClient to pull all of your types into synchronicity between the frontend and the backend
