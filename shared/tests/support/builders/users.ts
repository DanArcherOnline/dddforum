import { CreateUserBuilder } from './createUserBuilder';

export class UserBuilder {
  makeValidatedUserBuilder() {
    return new CreateUserBuilder();
  }
}
