How to Connect a Protocol Driver Layer using Puppeteer #horizontalDecoupling #verticalSlicing Last updated: September 7th, 2024

Topics: protocol driver, puppeteer, program by wishful thinking

Major Topics: Behaviour-Driven Design, Design Patterns

Now that we’ve got the page object layer created, let’s implement the subsequent layers to get our tests passing. It’s time for the protocol driver layer.

Lesson Goals In this lesson, we’re going to cover:

what is puppeteer & how do we set it up? how do you express clicks and keypresses effectively? how do you connect to react? What is puppeteer & the protocol driver layer? Underneath the domain specific language layer with the page objects sits the protocol driver layer.

This is the final layer of code which translates the instructions we make from our page objects to the actual clicks and keypresses against the UI.

To do so, we can use a web driving tool like _Puppeteer_ or Cypress.

Similarly to how we use axios to handle the super low-level work of http requests and whatnot, as a frontend protocol driver, it interacts with the application on our behalf.

Let’s get this installed

In your backend project, install puppeteer with:

npm install --save-dev puppeteer The way I like to set this up in my tests is as follows:

beforeAll(async () => { databaseFixture = new DatabaseFixture(); puppeteerPageDriver = await PuppeteerPageDriver.create({ headless: false, slowMo: 50, }); app = createAppObject(puppeteerPageDriver); pages = app.pages; }); Every time I use some sort of infrastructural tool, I’ll always wrap it in my own abstraction so that I can specify the APIs I want.

In this case, I want to just be able to say create and have one.

Look at what we’re abstracting using a factory method.

import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';

export class PuppeteerPageDriver { constructor(public browser: Browser, public page: Page) {}

public static async create(\_options?: PuppeteerLaunchOptions) { const browserInstance = await puppeteer.launch(\_options); const page = await browserInstance.newPage(); return new PuppeteerPageDriver(browserInstance, page); } } And finally, we pass the instance into the page objects themselves.

export function createAppObject(pageDriver: PuppeteerPageDriver): App {\
return { pages: { registration: new RegistrationPage(pageDriver) }, layout: { header: new HeaderComponent(pageDriver), notifications: new AppNotifications(pageDriver) } } } Expressing the intent How to talk to the UI using Puppeteer Puppeteer has APIs that let you talk to the UI, but they typically end up looking a little messy (just like every other web driver tool).

For example, if I wanted to click some element, the code would look something like this:

try { let element = await driver.page.waitForSelector('.some-selector', { timeout: 3000 }); } catch (err) { console.log("Element not found"); } That’s the base API.

But as I said before. Encapsulation. Let’s define the API we want.

Expressing the intent of the registration page Taking a look at the registration page, it’s clear that there are a few methods that we need to implement.

import { PuppeteerPageDriver } from "../driver"; import { PageObject } from "./pageObject"; import { CreateUserInput } from "@dddforum/shared/src/api/users";

export class RegistrationPage extends PageObject { private elements: PageElements;

constructor(driver: PuppeteerPageDriver) { super(driver, "http://localhost:5173/join");

}

async enterAccountDetails(input: CreateUserInput) { // to implement }

async acceptMarketingEmails() { // to implement }

async submitRegistrationForm() { // to implement } } Let’s do enter account details first.

The first thing I’d do is just comment what I want.

async enterAccountDetails(input: CreateUserInput) { // type the email // type the username // type the firstname // type the lastname } That’s what. Now how might we do this?

Well, as I said, we could use puppeteer directly… but I find that API messy.

Instead, I’m going to continue to program by wishful thinking.

I’m going to imagine that I have a PageElements object, and this object knows about all of the elements I need on this page by KEY instead of the selector.

async enterAccountDetails(input: CreateUserParams) { await this.elements.get("email").then((e: any) => e.type(input.email)); await this.elements.get("username").then((e: any) => e.type(input.username)); await this.elements.get("firstname").then((e: any) => e.type(input.firstName)); await this.elements.get("lastname").then((e: any) => e.type(input.lastName)); } And there we go.

Now to invent this thing.

In the constructor, I created a PageElements object and passed it the selectors using a reasonable pattern.

export class RegistrationPage extends PageObject { private elements: PageElements;

constructor(driver: PuppeteerPageDriver) { super(driver, "http://localhost:5173/join"); this.elements = new PageElements({ email: { selector: ".registration.email", type: "input" }, username: { selector: ".registration.username", type: "input" }, firstname: { selector: ".registration.first-name", type: "input" }, lastname: { selector: ".registration.last-name", type: "input" }, marketingCheckbox: { selector: ".registration.marketing-emails", type: "checkbox", }, submit: { selector: ".registration.submit-button", type: "button" }, }, driver); } And then it’s just implementing this object to make it work.

import { PuppeteerPageDriver } from "../driver";

type ElementType = "input" | "button" | "div" | "checkbox";

export type PageElementsSelector = { selector: string; type: ElementType } | Component;

export interface PageElementsConfig { [key: string]: PageElementsSelector; }

export abstract class Component { constructor (protected driver: PuppeteerPageDriver) {

} }

export class PageElements { constructor( private config: PageElementsConfig, private driver: PuppeteerPageDriver ) {}

async get(nameKey: string, timeout?: number) { const component = this.config[nameKey]; let element;

```
if (component instanceof Component) {
  return component
}

try {
  element = await this.driver.page.waitForSelector(component.selector, { timeout });
} catch (err) {
  console.log("Element not found");
  throw new Error(`Element ${nameKey} not found!`);
}

if (!element) {
  throw new Error(
    `Could not load component's element ${nameKey}: maybe it's not on the page yet.`
  );
}

return element;
```

} } That’s it. Working completely, totally, outside-in, guided by our tests.

Completing the class, it’d look like the following

import { PuppeteerPageDriver } from "../driver"; import { PageObject } from "./pageObject"; import { PageElements, PageElementsConfig } from "../components"; import { CreateUserParams } from "@dddforum/shared/src/api/users"; import { appSelectors } from "@dddforum/frontend/src/shared/selectors";

export class RegistrationPage extends PageObject { private elements: PageElements;

constructor(driver: PuppeteerPageDriver) { super(driver, "http://localhost:5173/join"); this.elements = new PageElements({ email: { selector: ".registration.email", type: "input" }, username: { selector: ".registration.username", type: "input" }, firstname: { selector: ".registration.first-name", type: "input" }, lastname: { selector: ".registration.last-name", type: "input" }, marketingCheckbox: { selector: ".registration.marketing-emails", type: "checkbox", }, submit: { selector: ".registration.submit-button", type: "button" }, }, driver); }

async enterAccountDetails(params: CreateUserParams) { await this.elements.get("email").then((e: any) => e.type(params.email)); await this.elements.get("username").then((e: any) => e.type(params.username)); await this.elements.get("firstname").then((e: any) => e.type(params.firstName)); await this.elements.get("lastname").then((e: any) => e.type(params.lastName)); }

async acceptMarketingEmails() { await this.elements.get("marketingCheckbox").then((e: any) => e.click());

}

async submitRegistrationForm() { await this.elements.get("submit").then((e: any) => e.click()); } }

Connecting to the frontend Ideally, if we were starting from scratch, your React code should have emerged as a result of the test we’d just written.

But since we’re retro-fitting our code to work with the tests, let’s adjust the selectors now.

You’ll have to adjust the:

header mainPage registrationForm Here’s the form with the main selectors and the new email marketing code.

import { useState } from "react"; import { Link } from "react-router-dom"; import { CreateUserCommand } from '@dddforum/shared/src/api/users'

interface RegistrationFormProps { onSubmit: (formDetails: CreateUserCommand, allowMarketingEmails: boolean) => void; }

export const RegistrationForm = (props: RegistrationFormProps) => { const [email, setEmail] = useState("email"); const [username, setUsername] = useState("username"); const [firstName, setFirstName] = useState("firstName"); const [lastName, setLastName] = useState("lastName"); const [allowMarketingEmails, setAllowMarketingEmails] = useState(false);

const toggleAllowMarketingEmails = () => { setAllowMarketingEmails(!allowMarketingEmails); };

const handleSubmit = () => { props.onSubmit({ email, username, firstName, lastName, }, allowMarketingEmails); };

return ( \<input className="registration email" type="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} > \<input className="registration username" type="text" placeholder="username" onChange={(e) => setUsername(e.target.value)} > \<input className="registration first-name" type="text" placeholder="first name" onChange={(e) => setFirstName(e.target.value)} > \<input className="registration last-name" type="text" placeholder="last name" onChange={(e) => setLastName(e.target.value)} > \<button onClick={() => handleSubmit()} className="registration submit-button" type="submit" > Submit \<input className="registration marketing-emails" type="checkbox" checked={allowMarketingEmails} onChange={() => toggleAllowMarketingEmails()} /> Want to be notified about events & discounts? Already have an account? Login ); }; Notice the class names!

And then, if we run our test, we should see that it passes.

That’s all you should need to complete your test!

FAQ “What if the selectors don’t exist?” You gotta make ‘em exist. Analyze the structure of your React components and aim to keep it in alignment with the page object model. This is why working top-down/outside-in is key.

“What about the notifications?” When you use the toast notifications, you can pass an id to it like so:

toast('Success! Redirecting home.', { toastId: `success-toast` }) Make sure you do this, because it becomes the selector we use to grab the notifications.

“What about the header?” You’ll want to also set up the other page objects masquerading as components, like the Header.

import { PuppeteerPageDriver } from "../driver/puppeteerPageDriver"; import { Component, PageElements } from "./component";

export class HeaderComponent extends Component { private elements: PageElements;

constructor(driver: PuppeteerPageDriver) { super(driver); this.elements = new PageElements({ header: { selector: '.header.username', type: 'div' }, }, driver) }

async getUsernameFromHeader () { let usernameElement = await this.elements.get('header'); return usernameElement?.evaluate((e) => e.textContent); } } Your Turn! Now get to it, my friend.

Specifically, make sure you’ve set up the following.

✅ I have implemented the successful registration with marketing emails accepted scenario

✅ I have implemented the invalid or missing registration details scenario

✅ I have implemented the account already created with email scenario

Summary Puppeteer is a web driver — the protocol driver in the 4-tier acceptance testing stack for the UI; it handles the actual clicks and presses. Continue to program by wishful thinking as much as you can, focusing on a good developer experience before passing off control to the web driver. As you work outside-in, you may realize the need to adjust selectors so that they can be reached by Puppeteer.
