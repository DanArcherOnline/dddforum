import { faker } from "@faker-js/faker";

export class TextUtil {
  static createRandomText(length: number): string {
    return faker.string.alpha(length);
  }

  static createRandomEmail(): string {
    return faker.internet.email();
  }
}
