import { CreateUserInput } from '@dddforum/shared/src/api/users';
import { TextUtil } from '@dddforum/shared/src/utils/textUtils';

export class CreateUserInputBuilder {
  private props: Partial<CreateUserInput>;

  constructor() {
    this.props = {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
    };
  }

  withAllRandomDetails() {
    this.withFirstName(TextUtil.createRandomText(10));
    this.withLastName(TextUtil.createRandomText(10));
    this.withEmail(TextUtil.createRandomEmail());
    this.withUsername(TextUtil.createRandomText(10));
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

  withEmail(email: string) {
    this.props = { ...this.props, email };
    return this;
  }

  withUsername(username: string) {
    this.props = { ...this.props, username };
    return this;
  }

  build(): CreateUserInput {
    return this.props as CreateUserInput;
  }
}
