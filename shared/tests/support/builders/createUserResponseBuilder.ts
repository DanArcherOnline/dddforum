import { User } from '@dddforum/shared/src/api/users';

type CreateUserResponseData = Partial<User>;

export class CreateUserResponseBuilder {
  private props: CreateUserResponseData;

  constructor() {
    this.props = {};
  }

  withEmail(email: string) {
    this.props = { ...this.props, email };
    return this;
  }

  withFirstName(firstName: string) {
    this.props = { ...this.props, firstName };
    return this;
  }

  withLastName(lastName: string) {
    this.props = { ...this.props, lastName };
    return this;
  }

  withUsername(username: string) {
    this.props = { ...this.props, username };
    return this;
  }

  build() {
    return {
      success: true,
      data: this.props as User,
      error: {},
    };
  }
}
