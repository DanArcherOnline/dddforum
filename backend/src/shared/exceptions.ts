export class AppException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
  ) {
    super(errorCode);
  }
}

export class UsernameAlreadyTakenException extends AppException {
  constructor() {
    super(409, "UsernameAlreadyTaken");
  }
}

export class EmailAlreadyInUseException extends AppException {
  constructor() {
    super(409, "EmailAlreadyInUse");
  }
}

export class UserNotFoundException extends AppException {
  constructor() {
    super(404, "UserNotFound");
  }
}

export class InvalidRequestBodyException extends AppException {
  constructor() {
    super(400, "InvalidRequestBody");
  }
}

export class ServerErrorException extends AppException {
  constructor() {
    super(500, "ServerError");
  }
}
