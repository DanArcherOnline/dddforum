import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RegistrationForm } from "./components/RegistrationForm";
import { Layout } from "./components/layout";
import { useUserSession } from "./context/UserSessionContext";
import { registerUser } from "./network/registerUser";
import type { RegistrationInput } from "./registration/types";
import { validateRegistrationInput } from "./registration/validateRegistrationInput";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useUserSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const handleSubmitRegistrationForm = async (input: RegistrationInput) => {
    const validation = validateRegistrationInput(input);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerUser(validation.data);
      setUser(user);
      toast.success("Account created successfully.");
      redirectTimerRef.current = setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div>Create Account</div>
      <RegistrationForm
        onSubmit={(submitted: RegistrationInput) =>
          handleSubmitRegistrationForm(submitted)
        }
        isSubmitting={isSubmitting}
      />
    </Layout>
  );
};
