import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RegistrationForm } from "./components/RegistrationForm";
import { Layout } from "./components/layout";
import { useUserSession } from "./context/UserSessionContext";
import { api } from "./api/index";
import type { CreateUserInput } from "./registration/types";
import { validateRegistrationInput } from "./registration/validateRegistrationInput";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useUserSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spinner = {
    activate: () => setIsSubmitting(true),
    deactivate: () => setIsSubmitting(false),
  };

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const handleSubmitRegistrationForm = async (input: CreateUserInput) => {
    // Validate the form
    const validationResult = validateRegistrationInput(input);

    // If the form is invalid
    if (!validationResult.success) {
      // Show an error toast (for invalid input)
      return toast.error(validationResult.errorMessage);
    }

    // If the form is valid
    // Start loading spinner
    spinner.activate();
    try {
      // Make API call
      const response = await api.users.register(input);
      if (!response.success) {
        switch (response.error.code) {
          case "EmailAlreadyInUse":
            return toast.error("This email is already in use. Perhaps you want to log in?");
          case "UsernameAlreadyTaken":
            return toast.error("Please try a different username, this one is already taken.");
          case "ValidationError":
            // We could further improve this with more refined types
            // to specify which form field was invalid.
            return toast.error(response.error.message);
          case "ServerError":
          default:
            return toast.error("Some backend error occurred");
        }
      }

      setUser(response.data);
      // Stop the loading spinner
      spinner.deactivate();
      // Show the toast
      toast("Success! Redirecting home.");
      // In 3 seconds, redirect to the main page
      redirectTimerRef.current = setTimeout(() => { navigate("/"); }, 3000);
    } catch (err) {
      // If the call failed
      // Stop the spinner
      spinner.deactivate();
      // Show the toast (for unknown error)
      return toast.error("Some backend error occurred");
    }
  };

  return (
    <Layout>
      <div>Create Account</div>
      <RegistrationForm
        onSubmit={(input: CreateUserInput) =>
          handleSubmitRegistrationForm(input)
        }
        isSubmitting={isSubmitting}
      />
    </Layout>
  );
};
