import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { signIn, SignInInput } from "aws-amplify/auth";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";
import { LoginSchema, type LoginInput } from "@/schemas/AuthSchemas";

export const useLoginController = (options: { onLoginSuccess: () => void }) => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const setGlobalMessage = useSetGlobalMessage();

  const validateForm = useCallback((): boolean => {
    const result = LoginSchema.safeParse({
      email: userEmail,
      password: userPassword,
    });

    if (!result.success) {
      const errors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginInput;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  }, [userEmail, userPassword]);

  const signInMutation = useMutation({
    mutationFn: async (input: SignInInput) => {
      setErrorMessage("");
      try {
        const result = await signIn(input);
        if (result.isSignedIn) {
          setGlobalMessage({
            color: "success",
            content: "Successfully logged in!",
          });
          options.onLoginSuccess();
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to login";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        throw error;
      }
    },
  });

  return {
    userEmail,
    setUserEmail,
    userPassword,
    setUserPassword,
    errorMessage,
    validationErrors,
    validateForm,
    signInMutation,
  };
};
