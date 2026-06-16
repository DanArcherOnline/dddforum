import { useState } from "react";
import { Link } from "react-router-dom";
import type { CreateUserParams } from "../registration/types";
import { appSelectors, toClass } from "../shared/selectors";

interface RegistrationFormProps {
  onSubmit: (formDetails: CreateUserParams, allowMarketingEmails: boolean) => void;
}

export const RegistrationForm = (props: RegistrationFormProps) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [allowMarketingEmails, setAllowMarketingEmails] = useState(false);

  const toggleAllowMarketingEmails = () => {
    setAllowMarketingEmails(!allowMarketingEmails);
  };

  const handleSubmit = () => {
    props.onSubmit({ email, username, firstName, lastName }, allowMarketingEmails);
  };

  const selectors = appSelectors.registration.registrationForm;

  return (
    <>
      <input
        className={toClass(selectors.email.selector)}
        type="email"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={toClass(selectors.username.selector)}
        type="text"
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className={toClass(selectors.firstname.selector)}
        type="text"
        placeholder="first name"
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        className={toClass(selectors.lastname.selector)}
        type="text"
        placeholder="last name"
        onChange={(e) => setLastName(e.target.value)}
      />
      <button
        onClick={() => handleSubmit()}
        className={toClass(selectors.submit.selector)}
        type="submit"
      >
        Submit
      </button>
      <input
        className={toClass(selectors.marketingCheckbox.selector)}
        type="checkbox"
        checked={allowMarketingEmails}
        onChange={() => toggleAllowMarketingEmails()}
      />
      Want to be notified about events &amp; discounts?
      <Link to="/join">Already have an account? Login</Link>
    </>
  );
};
