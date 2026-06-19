import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RegistrationForm } from "./components/RegistrationForm";
import { Layout } from "./components/layout";
import { useUserSession } from "./context/UserSessionContext";
import { api } from "./api/index";
import type { CreateUserParams } from "./registration/types";
import { validateRegistrationInput } from "./registration/validateRegistrationInput";
import { appSelectors, toClass } from "./shared/selectors";

const failureToastClass = toClass(appSelectors.notifications.failure);
const successToastClass = toClass(appSelectors.notifications.success);

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

  const handleSubmitRegistrationForm = async (
    input: CreateUserParams,
    allowMarketingEmails: boolean,
  ) => {
    const showError = (message: string) => {
      toast.error(message, { classNames: { toast: failureToastClass } });
    };

    const validationResult = validateRegistrationInput(input);

    if (!validationResult.success) {
      return showError(validationResult.errorMessage);
    }

    try {
      const response = await api.users.register(input);
      if (!response.success) {
        switch (response.error.code) {
          case "EmailAlreadyInUse":
            return showError("This email is already in use.");
          case "UsernameAlreadyTaken":
            return showError("This username is already taken.");
          case "ValidationError":
            return showError(response.error.message ?? "Invalid input.");
          case "ServerError":
          default:
            return showError("Oops... Something went wrong. Please try again later.");
        }
      }

      if (allowMarketingEmails) {
        await api.marketing.addEmailToList(input.email);
      }

      setUser(response.data);
      toast("Success! Redirecting home.", { classNames: { toast: successToastClass } });
      redirectTimerRef.current = setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      return showError("Oops... Something went wrong. Please try again later.");
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
