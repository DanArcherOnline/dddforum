export const appSelectors = {
  registration: {
    registrationForm: {
      email: { selector: ".registration.email", type: "input" as const },
      username: { selector: ".registration.username", type: "input" as const },
      firstname: { selector: ".registration.first-name", type: "input" as const },
      lastname: { selector: ".registration.last-name", type: "input" as const },
      marketingCheckbox: {
        selector: ".registration.marketing-emails",
        type: "checkbox" as const,
      },
      submit: { selector: ".registration.submit-button", type: "button" as const },
    },
  },
  header: { selector: ".header.username", type: "div" as const },
  notifications: {
    failure: ".failure-toast",
    success: ".success-toast",
  },
};

export function toClass(input: string): string {
  // Remove the leading dot and replace all remaining dots with spaces
  return input.slice(1).replace(/\./g, " ");
}

export function toId(input: string): string {
  if (!input.startsWith("#")) {
    throw new Error("Input string must start with a hash symbol (#).");
  }

  // Remove the leading hash symbol
  return input.slice(1);
}
