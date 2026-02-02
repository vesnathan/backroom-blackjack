"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { client } from "@/lib/amplify";
import { CHIP_PACKAGES, type ChipPackage } from "@backroom-blackjack/shared";

// Hook to check if we're on a small screen
function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsSmall(window.innerHeight < 500 || window.innerWidth < 600);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isSmall;
}

// GraphQL mutation for creating chip checkout session
const CREATE_CHIP_CHECKOUT = /* GraphQL */ `
  mutation CreateChipCheckout($input: CreateChipCheckoutInput!) {
    createChipCheckout(input: $input) {
      checkoutUrl
      sessionId
    }
  }
`;

interface ChipStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChipStoreModal({
  isOpen,
  onClose,
}: ChipStoreModalProps) {
  const { isAuthenticated } = useAuth();
  const { chipPurchaseBonus, calculateChipPurchase } = useSubscription();
  const isSmallScreen = useIsSmallScreen();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handlePurchase = async (pkg: ChipPackage) => {
    if (!isAuthenticated) {
      setError("You must be logged in to purchase chips");
      return;
    }

    setIsLoading(true);
    setLoadingPackage(pkg.id);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const response = await client.graphql({
        query: CREATE_CHIP_CHECKOUT,
        variables: {
          input: {
            packageId: pkg.id,
            successUrl: `${baseUrl}/?chips=success`,
            cancelUrl: `${baseUrl}/?chips=cancelled`,
          },
        },
        authMode: "userPool",
      });

      const result = (
        response as {
          data?: {
            createChipCheckout?: {
              checkoutUrl: string;
              sessionId?: string;
            };
          };
        }
      ).data?.createChipCheckout;

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError("Failed to create checkout session. Please try again.");
        setIsLoading(false);
        setLoadingPackage(null);
      }
    } catch (err) {
      console.error("Failed to create chip checkout:", err);
      setError("Failed to create checkout session. Please try again.");
      setIsLoading(false);
      setLoadingPackage(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
      }}
    >
      {/* Backdrop button - handles click to close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close chip store"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          border: "none",
          cursor: "pointer",
        }}
      />

      {/* Dialog content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chip-store-title"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#1a1a1a",
          border: "2px solid #FFD700",
          borderRadius: isSmallScreen ? "12px" : "16px",
          padding: isSmallScreen ? "12px" : "24px",
          maxWidth: "600px",
          width: isSmallScreen ? "95%" : "90%",
          maxHeight: isSmallScreen ? "95vh" : "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isSmallScreen ? "12px" : "20px",
          }}
        >
          <h2
            id="chip-store-title"
            style={{
              color: "#FFD700",
              fontSize: isSmallScreen ? "18px" : "24px",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            Buy Chips
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: isSmallScreen ? "20px" : "24px",
              cursor: "pointer",
              padding: "4px 8px",
              minWidth: "44px",
              minHeight: "44px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Subscription bonus info */}
        {chipPurchaseBonus > 0 && (
          <div
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.2)",
              border: "1px solid #4CAF50",
              borderRadius: "8px",
              padding: isSmallScreen ? "8px" : "12px",
              marginBottom: isSmallScreen ? "12px" : "20px",
              textAlign: "center",
              fontSize: isSmallScreen ? "12px" : "14px",
            }}
          >
            <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
              {chipPurchaseBonus}% Bonus
            </span>
            <span style={{ color: "#AAA", marginLeft: "8px" }}>
              from your subscription!
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(244, 67, 54, 0.2)",
              border: "1px solid #F44336",
              borderRadius: "8px",
              padding: isSmallScreen ? "8px" : "12px",
              marginBottom: isSmallScreen ? "12px" : "20px",
              color: "#F44336",
              textAlign: "center",
              fontSize: isSmallScreen ? "12px" : "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Chip packages */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmallScreen
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(160px, 1fr))",
            gap: isSmallScreen ? "8px" : "16px",
            marginTop: isSmallScreen ? "8px" : "0",
          }}
        >
          {CHIP_PACKAGES.map((pkg) => {
            const { bonusChips, totalChips } = calculateChipPurchase(pkg.chips);
            const priceDisplay = `$${(pkg.priceInCents / 100).toFixed(0)}`;
            const isLoadingThis = loadingPackage === pkg.id;

            return (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: pkg.popular ? "#2a2a2a" : "#222",
                  border: pkg.popular ? "2px solid #FFD700" : "1px solid #444",
                  borderRadius: isSmallScreen ? "8px" : "12px",
                  padding: isSmallScreen ? "10px 8px" : "20px",
                  paddingTop: pkg.popular
                    ? isSmallScreen
                      ? "18px"
                      : "28px"
                    : isSmallScreen
                      ? "10px"
                      : "20px",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {pkg.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: isSmallScreen ? "-8px" : "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#FFD700",
                      color: "#000",
                      padding: isSmallScreen ? "2px 6px" : "4px 12px",
                      borderRadius: "10px",
                      fontSize: isSmallScreen ? "8px" : "11px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    BEST VALUE
                  </div>
                )}

                {/* Chip amount */}
                <div
                  style={{
                    fontSize: isSmallScreen ? "18px" : "28px",
                    fontWeight: "bold",
                    color: "#FFD700",
                    marginBottom: isSmallScreen ? "2px" : "4px",
                  }}
                >
                  {pkg.chips.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: isSmallScreen ? "10px" : "12px",
                    color: "#888",
                    marginBottom: isSmallScreen ? "6px" : "12px",
                  }}
                >
                  chips
                </div>

                {/* Bonus info - hide on mobile for space */}
                {bonusChips > 0 && !isSmallScreen && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#4CAF50",
                      marginBottom: "12px",
                    }}
                  >
                    +{bonusChips.toLocaleString()} bonus ={" "}
                    {totalChips.toLocaleString()} total
                  </div>
                )}

                {/* Price */}
                <div
                  style={{
                    fontSize: isSmallScreen ? "14px" : "20px",
                    fontWeight: "bold",
                    color: "#FFF",
                    marginBottom: isSmallScreen ? "8px" : "16px",
                  }}
                >
                  {priceDisplay}
                </div>

                {/* Buy button */}
                <button
                  type="button"
                  onClick={() => handlePurchase(pkg)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    backgroundColor: isLoadingThis ? "#666" : "#4CAF50",
                    color: "#FFF",
                    border: "none",
                    borderRadius: isSmallScreen ? "6px" : "8px",
                    padding: isSmallScreen ? "8px 4px" : "12px",
                    fontSize: isSmallScreen ? "11px" : "14px",
                    fontWeight: "bold",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading && !isLoadingThis ? 0.5 : 1,
                    minHeight: "44px",
                  }}
                >
                  {isLoadingThis ? "..." : "Buy Now"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: isSmallScreen ? "10px" : "20px",
            textAlign: "center",
            fontSize: isSmallScreen ? "10px" : "12px",
            color: "#666",
          }}
        >
          Secure payment powered by Stripe
        </div>
      </div>
    </div>
  );
}
