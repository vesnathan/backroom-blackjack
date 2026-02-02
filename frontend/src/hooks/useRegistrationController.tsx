import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  signUp,
  confirmSignUp,
  SignUpInput,
  ConfirmSignUpInput,
  signIn,
} from "aws-amplify/auth";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";
import {
  RegistrationSchema,
  ConfirmationCodeSchema,
  type RegistrationInput,
  type ConfirmationCodeInput,
} from "@/schemas/AuthSchemas";

export enum REGISTRATION_STEP {
  ENTER_DETAILS = "enter-details",
  ENTER_CONFIRMATION_CODE = "enter-confirmation-code",
}

export const useRegistrationController = (options: {
  onRegistrationSuccess: () => void | Promise<void>;
  captureUnknownError?: (err: Error) => void;
}) => {
  const [activeStep, setActiveStep] = useState<REGISTRATION_STEP>(
    REGISTRATION_STEP.ENTER_DETAILS,
  );
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmationDestination, setConfirmationDestination] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Partial<
      Record<keyof RegistrationInput | keyof ConfirmationCodeInput, string>
    >
  >({});
  const setGlobalMessage = useSetGlobalMessage();

  const validateRegistrationForm = useCallback((): boolean => {
    const result = RegistrationSchema.safeParse({
      email: userEmail,
      username,
      password: userPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors: Partial<Record<keyof RegistrationInput, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegistrationInput;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  }, [userEmail, username, userPassword, confirmPassword]);

  const validateConfirmationForm = useCallback((): boolean => {
    const result = ConfirmationCodeSchema.safeParse({
      confirmationCode,
    });

    if (!result.success) {
      const errors: Partial<Record<keyof ConfirmationCodeInput, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ConfirmationCodeInput;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  }, [confirmationCode]);

  const signUpMutation = useMutation({
    mutationFn: async (input: SignUpInput) => {
      setErrorMessage("");
      try {
        const result = await signUp(input);
        if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
          setConfirmationDestination(
            result.nextStep.codeDeliveryDetails?.destination || userEmail,
          );
          setActiveStep(REGISTRATION_STEP.ENTER_CONFIRMATION_CODE);
          setGlobalMessage({
            color: "info",
            content: "Please check your email for confirmation code",
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to sign up";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        if (error instanceof Error) {
          options.captureUnknownError?.(error);
        }
        throw error;
      }
    },
  });

  const confirmSignUpMutation = useMutation({
    mutationFn: async (input: ConfirmSignUpInput & { password: string }) => {
      setErrorMessage("");
      try {
        await confirmSignUp({
          username: input.username,
          confirmationCode: input.confirmationCode,
        });

        // Auto login after confirmation
        await signIn({
          username: input.username,
          password: input.password,
        });

        setGlobalMessage({
          color: "success",
          content: "Account confirmed! Welcome!",
        });
        await options.onRegistrationSuccess();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to confirm account";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        if (error instanceof Error) {
          options.captureUnknownError?.(error);
        }
        throw error;
      }
    },
  });

  return {
    activeStep,
    userEmail,
    setUserEmail,
    username,
    setUsername,
    userPassword,
    setUserPassword,
    confirmPassword,
    setConfirmPassword,
    confirmationCode,
    setConfirmationCode,
    confirmationDestination,
    errorMessage,
    validationErrors,
    validateRegistrationForm,
    validateConfirmationForm,
    signUpMutation,
    confirmSignUpMutation,
  };
};
