import { type FormEvent, useState } from "react";
import type { CreateUserParams } from "../registration/types";

type RegistrationFormProps = {
  onSubmit: (input: CreateUserParams) => void;
  isSubmitting: boolean;
};

export function RegistrationForm({
  onSubmit,
  isSubmitting,
}: RegistrationFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ email, username, firstName, lastName });
  };

  const disabled = isSubmitting;

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <label className="registration-form-field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled}
          required
        />
      </label>
      <label className="registration-form-field">
        <span>Username</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={disabled}
          required
        />
      </label>
      <label className="registration-form-field">
        <span>First name</span>
        <input
          type="text"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={disabled}
          required
        />
      </label>
      <label className="registration-form-field">
        <span>Last name</span>
        <input
          type="text"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={disabled}
          required
        />
      </label>
      <button type="submit" className="submit-button" disabled={disabled}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
