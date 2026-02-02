"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, Tooltip } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { sendInvite } from "@/lib/api/invite";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://backroom-blackjack.com";

interface InviteFriendProps {
  className?: string;
}

type SendStatus = "idle" | "sending" | "success" | "error";

/**
 * Invite a Friend component with email invite and social share buttons
 * Styled with Backroom Blackjack gold theme
 */
export function InviteFriend({ className = "" }: InviteFriendProps) {
  const { user } = useAuth();
  const { executeRecaptcha, isConfigured } = useRecaptcha();

  const [isOpen, setIsOpen] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const referralUrl = user ? `${APP_URL}/?ref=${user.userId}` : APP_URL;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const resetForm = () => {
    setFriendName("");
    setEmail("");
    setSendStatus("idle");
    setErrorMessage("");
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setTimeout(resetForm, 300);
    } else {
      setIsOpen(true);
    }
  };

  const handleSendInvite = async () => {
    if (!friendName.trim() || !email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      setSendStatus("error");
      return;
    }

    setSendStatus("sending");
    setErrorMessage("");

    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (isConfigured) {
        const token = await executeRecaptcha("send_invite");
        if (!token) {
          throw new Error("reCAPTCHA verification failed. Please try again.");
        }
        recaptchaToken = token;
      }

      // Send invite via GraphQL
      await sendInvite({
        friendName: friendName.trim(),
        email: email.trim(),
        recaptchaToken,
      });

      setSendStatus("success");

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(resetForm, 300);
      }, 2000);
    } catch (error) {
      console.error("Failed to send invite:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send invite. Please try again.";
      setErrorMessage(message);
      setSendStatus("error");
    }
  };

  const isFormValid = friendName.trim().length > 0 && email.trim().length > 0;

  return (
    <div
      ref={dropdownRef}
      className={`relative flex flex-col items-center gap-2 ${className}`}
    >
      {/* Share buttons */}
      <SocialShareButtons
        url={referralUrl}
        title="Join me at Backroom Blackjack!"
        description="Master card counting with AI opponents in this immersive blackjack trainer."
      />

      {/* Invite icon - inline with share buttons, highlighted */}
      <Tooltip content="Invite a Friend">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          className="bg-yellow-600/50 hover:bg-yellow-500/60 min-w-8 w-8 h-8"
          onPress={handleToggle}
          aria-label="Invite a Friend"
        >
          <svg
            className="w-4 h-4 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </Button>
      </Tooltip>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-80 p-4 bg-gray-900 border border-yellow-600/50 rounded-lg shadow-xl z-50"
          style={{ minWidth: "320px" }}
        >
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-yellow-400 font-semibold text-lg">
                Invite a Friend
              </h3>
              <p className="text-gray-400 text-sm">
                Send an email invite or share on social media
              </p>
            </div>

            {sendStatus === "success" ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-900/30 mb-3">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-400 font-medium">Invite sent!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {friendName} will receive your invitation shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Input
                    label="Friend's Name"
                    placeholder="Enter their name"
                    value={friendName}
                    onValueChange={setFriendName}
                    size="sm"
                    variant="bordered"
                    isDisabled={sendStatus === "sending"}
                    classNames={{
                      input: "text-white",
                      label: "text-gray-400",
                      inputWrapper:
                        "border-gray-600 hover:border-yellow-600/50 focus-within:!border-yellow-500",
                    }}
                  />
                  <Input
                    label="Email Address"
                    placeholder="friend@example.com"
                    type="email"
                    value={email}
                    onValueChange={setEmail}
                    size="sm"
                    variant="bordered"
                    isDisabled={sendStatus === "sending"}
                    isInvalid={sendStatus === "error"}
                    errorMessage={sendStatus === "error" ? errorMessage : ""}
                    classNames={{
                      input: "text-white",
                      label: "text-gray-400",
                      inputWrapper:
                        "border-gray-600 hover:border-yellow-600/50 focus-within:!border-yellow-500",
                    }}
                  />
                </div>

                <Button
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold"
                  onPress={handleSendInvite}
                  isDisabled={!isFormValid || sendStatus === "sending"}
                  isLoading={sendStatus === "sending"}
                >
                  Send Email Invite
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Protected by reCAPTCHA -{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-500 hover:underline"
                  >
                    Privacy
                  </a>
                  {" & "}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-500 hover:underline"
                  >
                    Terms
                  </a>
                </p>

                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-500 text-xs text-center">
                    Your referral link:
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={referralUrl}
                      isReadOnly
                      size="sm"
                      variant="flat"
                      classNames={{
                        input: "text-gray-400 text-xs",
                        inputWrapper: "bg-gray-800/50",
                      }}
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-gray-800/50 hover:bg-yellow-900/30 min-w-12"
                      onPress={() => {
                        navigator.clipboard.writeText(referralUrl);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
