import { useState } from "react";
import { Link } from "react-router-dom";
import type { CreateUserParams } from "../registration/types";

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

  return (
    <>
      <input
        className="registration email"
        type="email"
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="registration username"
        type="text"
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="registration first-name"
        type="text"
        placeholder="first name"
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        className="registration last-name"
        type="text"
        placeholder="last name"
        onChange={(e) => setLastName(e.target.value)}
      />
      <button
        onClick={() => handleSubmit()}
        className="registration submit-button"
        type="submit"
      >
        Submit
      </button>
      <input
        className="registration marketing-emails"
        type="checkbox"
        checked={allowMarketingEmails}
        onChange={() => toggleAllowMarketingEmails()}
      />
      Want to be notified about events &amp; discounts?
      <Link to="/join">Already have an account? Login</Link>
    </>
  );
};
