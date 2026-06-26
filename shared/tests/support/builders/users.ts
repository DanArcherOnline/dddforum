import { CreateUserBuilder } from './createUserBuilder';
import { CreateUserResponseBuilder } from './createUserResponseBuilder';

export class UserBuilder {
  makeValidatedUserBuilder() {
    return new CreateUserBuilder();
  }

  makeCreateUserInputBuilder() {
    return new CreateUserBuilder();
  }

  makeCreateUserResponseBuilder() {
    return new CreateUserResponseBuilder();
  }
}
