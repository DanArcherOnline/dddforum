import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RegistrationForm } from "./components/RegistrationForm";
import { Layout } from "./components/layout";
import { useUserSession } from "./context/UserSessionContext";
import { api } from "./api/index";
import type { CreateUserParams } from "./registration/types";
import { validateRegistrationInput } from "./registration/validateRegistrationInput";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useUserSession();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const handleSubmitRegistrationForm = async (input: CreateUserParams, allowMarketingEmails: boolean) => {
    const validationResult = validateRegistrationInput(input);

    if (!validationResult.success) {
      return toast.error(validationResult.errorMessage);
    }

    try {
      const response = await api.users.register(input);
      if (!response.success) {
        switch (response.error.code) {
          case "EmailAlreadyInUse":
            return toast.error("This email is already in use. Perhaps you want to log in?");
          case "UsernameAlreadyTaken":
            return toast.error("Please try a different username, this one is already taken.");
          case "ValidationError":
            return toast.error(response.error.message);
          case "ServerError":
          default:
            return toast.error("Some backend error occurred");
        }
      }

      setUser(response.data);
      toast("Success! Redirecting home.", { id: "success-toast" });
      redirectTimerRef.current = setTimeout(() => { navigate("/"); }, 3000);
    } catch (err) {
      return toast.error("Some backend error occurred");
    }
  };

  return (
    <Layout>
      <div>Create Account</div>
      <RegistrationForm
        onSubmit={(input: CreateUserParams, allowMarketingEmails: boolean) =>
          handleSubmitRegistrationForm(input, allowMarketingEmails)
        }
      />
    </Layout>
  );
};
