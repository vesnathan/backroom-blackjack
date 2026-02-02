"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GameSettings,
  CountingSystem,
  BlackjackPayout,
} from "@/types/gameSettings";
import {
  SubscriptionTier,
  getGameRestrictions,
  getMinTierForCountingSystem,
  getMinTierForDeckCount,
  SUBSCRIPTION_TIER_NAMES,
} from "@backroom-blackjack/shared";

// Hook to check if we're on mobile
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerHeight < 500 || window.innerWidth < 900);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSave: (settings: Partial<GameSettings>) => void;
  userTier?: SubscriptionTier;
}

// Color constants for locked/disabled items
const LOCKED_BG_LIGHT = "rgba(100, 100, 100, 0.1)";
const LOCKED_BG = "rgba(100, 100, 100, 0.2)";
const LOCKED_BORDER = "rgba(100, 100, 100, 0.3)";
const BORDER_LIGHT = "rgba(255, 255, 255, 0.2)";

// Lock icon for restricted features
const LockIcon = ({ tier }: { tier: SubscriptionTier }) => (
  <span
    title={`Requires ${SUBSCRIPTION_TIER_NAMES[tier]} tier`}
    style={{
      marginLeft: "8px",
      fontSize: "12px",
      opacity: 0.7,
    }}
  >
    🔒 {SUBSCRIPTION_TIER_NAMES[tier]}
  </span>
);

const COUNTING_SYSTEMS = {
  HI_LO: {
    name: "Hi-Lo",
    description: "Most popular, Level 1, Balanced",
    values: "+1: 2-6 | 0: 7-9 | -1: 10-A",
  },
  KO: {
    name: "Knock-Out (KO)",
    description: "Easier, Level 1, Unbalanced (no true count)",
    values: "+1: 2-7 | 0: 8-9 | -1: 10-A",
  },
  HI_OPT_I: {
    name: "Hi-Opt I",
    description: "Level 1, Balanced",
    values: "+1: 3-6 | 0: 2,7-9,A | -1: 10-K",
  },
  HI_OPT_II: {
    name: "Hi-Opt II",
    description: "More complex, Level 2, Balanced",
    values: "+2: 4-5 | +1: 2-3,6-7 | 0: 8-9,A | -2: 10-K",
  },
  OMEGA_II: {
    name: "Omega II",
    description: "Advanced, Level 2, ~99% efficiency",
    values: "+2: 4-6 | +1: 2-3,7 | 0: 8,A | -1: 9 | -2: 10-K",
  },
};

export default function GameSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  userTier = SubscriptionTier.None,
}: GameSettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>(currentSettings);
  const router = useRouter();
  const isMobile = useIsMobile();

  // Get restrictions for user's tier
  const restrictions = getGameRestrictions(userTier);

  if (!isOpen) return null;

  // Responsive sizes
  const padding = isMobile ? "16px" : "32px";
  const headerFontSize = isMobile ? "20px" : "28px";
  const sectionFontSize = isMobile ? "14px" : "18px";
  const bodyFontSize = isMobile ? "12px" : "14px";
  const smallFontSize = isMobile ? "10px" : "12px";
  const buttonPadding = isMobile ? "6px 10px" : "8px 16px";
  const sectionMargin = isMobile ? "16px" : "24px";

  const handleUpgradeClick = () => {
    onClose();
    router.push("/subscribe");
  };

  const handleSave = () => {
    // Only save the settings that the modal manages
    onSave({
      numberOfDecks: settings.numberOfDecks,
      deckPenetration: settings.deckPenetration,
      dealerHitsSoft17: settings.dealerHitsSoft17,
      blackjackPayout: settings.blackjackPayout,
      countingSystem: settings.countingSystem,
      lateSurrenderAllowed: settings.lateSurrenderAllowed,
    });
    onClose();
  };

  const loadPreset = (
    preset: "vegas" | "single" | "double" | "european" | "bad",
  ) => {
    const presets: Record<string, Partial<GameSettings>> = {
      vegas: {
        numberOfDecks: 6,
        deckPenetration: 75,
        dealerHitsSoft17: true,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      single: {
        numberOfDecks: 1,
        deckPenetration: 60,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      double: {
        numberOfDecks: 2,
        deckPenetration: 65,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      european: {
        numberOfDecks: 6,
        deckPenetration: 75,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      bad: {
        numberOfDecks: 6,
        deckPenetration: 50,
        dealerHitsSoft17: true,
        blackjackPayout: BlackjackPayout.SIX_TO_FIVE,
      },
    };

    setSettings({ ...settings, ...presets[preset] });
  };

  // Calculate approximate house edge
  const calculateHouseEdge = (): number => {
    let edge = 0.5; // Base edge

    // Deck number impact
    if (settings.numberOfDecks === 1) edge -= 0.48;
    else if (settings.numberOfDecks === 2) edge -= 0.35;
    else if (settings.numberOfDecks === 4) edge -= 0.06;
    else if (settings.numberOfDecks === 8) edge += 0.02;

    // Dealer soft 17
    if (settings.dealerHitsSoft17) edge += 0.2;

    // Blackjack payout
    if (settings.blackjackPayout === BlackjackPayout.SIX_TO_FIVE) edge += 1.39;
    else if (settings.blackjackPayout === BlackjackPayout.TWO_TO_ONE)
      edge -= 2.27;
    else if (settings.blackjackPayout === BlackjackPayout.EVEN_MONEY)
      edge += 2.27;

    // Penetration impact (rough estimate)
    if (settings.deckPenetration < 60) edge += 0.1;

    return Math.round(edge * 100) / 100;
  };

  const houseEdge = calculateHouseEdge();

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          zIndex: 9998,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          maxHeight: isMobile ? "95vh" : "90vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: isMobile ? "500px" : "700px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: isMobile ? "2px solid #4A90E2" : "3px solid #4A90E2",
            borderRadius: isMobile ? "12px" : "20px",
            padding,
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              // eslint-disable-next-line sonarjs/no-duplicate-string
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: sectionMargin,
            }}
          >
            <h2
              style={{
                fontSize: headerFontSize,
                fontWeight: "bold",
                color: "#FFF",
              }}
            >
              {isMobile ? "⚙️ Settings" : "⚙️ Game Settings"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: buttonPadding,
                fontSize: bodyFontSize,
                cursor: "pointer",
                // eslint-disable-next-line sonarjs/no-duplicate-string
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                // eslint-disable-next-line sonarjs/no-duplicate-string
                e.currentTarget.style.backgroundColor =
                  // eslint-disable-next-line sonarjs/no-duplicate-string
                  "rgba(255, 255, 255, 0.1)";
                // eslint-disable-next-line sonarjs/no-duplicate-string
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              ✕ {isMobile ? "" : "Close"}
            </button>
          </div>

          {/* House Edge Display */}
          <div
            style={{
              backgroundColor:
                houseEdge > 1
                  ? "rgba(244, 67, 54, 0.2)"
                  : "rgba(76, 175, 80, 0.2)",
              border: `2px solid ${houseEdge > 1 ? "#F44336" : "#4CAF50"}`,
              borderRadius: isMobile ? "8px" : "12px",
              padding: isMobile ? "10px" : "16px",
              marginBottom: sectionMargin,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: smallFontSize,
                color: "#AAA",
                marginBottom: "4px",
              }}
            >
              Estimated House Edge
            </div>
            <div
              style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "bold",
                color: houseEdge > 1 ? "#F44336" : "#4CAF50",
              }}
            >
              {houseEdge}%
            </div>
            {houseEdge > 1 && (
              <div
                style={{
                  fontSize: smallFontSize,
                  color: "#F44336",
                  marginTop: "4px",
                  fontStyle: "italic",
                }}
              >
                Warning: Unfavorable rules!
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              Quick Presets
            </h3>
            <div
              style={{
                display: "flex",
                gap: isMobile ? "4px" : "8px",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  id: "vegas",
                  label: isMobile ? "Vegas" : "Vegas Strip",
                  icon: "🎰",
                },
                {
                  id: "single",
                  label: isMobile ? "1 Deck" : "Single Deck",
                  icon: "🃏",
                },
                {
                  id: "double",
                  label: isMobile ? "2 Deck" : "Double Deck",
                  icon: "🎴",
                },
                {
                  id: "european",
                  label: isMobile ? "Euro" : "European",
                  icon: "🇪🇺",
                },
                {
                  id: "bad",
                  label: isMobile ? "Bad" : "Bad Rules",
                  icon: "⚠️",
                },
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() =>
                    loadPreset(
                      preset.id as
                        | "vegas"
                        | "single"
                        | "double"
                        | "european"
                        | "bad",
                    )
                  }
                  style={{
                    backgroundColor: "rgba(74, 144, 226, 0.2)",
                    color: "#FFF",
                    border: isMobile
                      ? "1px solid #4A90E2"
                      : "2px solid #4A90E2",
                    borderRadius: isMobile ? "6px" : "8px",
                    padding: isMobile ? "6px 8px" : "8px 16px",
                    fontSize: smallFontSize,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.2)";
                  }}
                >
                  {preset.icon} {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deck Configuration */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              🃏 Deck Configuration
            </h3>

            {/* Number of Decks */}
            <fieldset
              style={{
                marginBottom: isMobile ? "12px" : "16px",
                border: "none",
                padding: 0,
              }}
            >
              <legend
                style={{
                  fontSize: smallFontSize,
                  color: "#AAA",
                  display: "block",
                  marginBottom: isMobile ? "6px" : "8px",
                }}
              >
                Number of Decks
              </legend>
              <div style={{ display: "flex", gap: isMobile ? "4px" : "8px" }}>
                {([1, 2, 4, 6, 8] as const).map((num) => {
                  const isAvailable = restrictions.deckCounts.includes(num);
                  const minTier = getMinTierForDeckCount(num);
                  return (
                    <button
                      type="button"
                      key={num}
                      onClick={() => {
                        if (isAvailable) {
                          setSettings({ ...settings, numberOfDecks: num });
                        } else {
                          handleUpgradeClick();
                        }
                      }}
                      style={{
                        backgroundColor:
                          settings.numberOfDecks === num
                            ? "#4A90E2"
                            : !isAvailable
                              ? LOCKED_BG
                              : "rgba(255, 255, 255, 0.1)",
                        color:
                          settings.numberOfDecks === num
                            ? "#FFF"
                            : !isAvailable
                              ? "#666"
                              : "#AAA",
                        border: isMobile ? "1px solid" : "2px solid",
                        borderColor:
                          settings.numberOfDecks === num
                            ? "#FFF"
                            : !isAvailable
                              ? LOCKED_BORDER
                              : BORDER_LIGHT,
                        borderRadius: isMobile ? "6px" : "8px",
                        padding: isMobile ? "8px 10px" : "10px 16px",
                        fontSize: smallFontSize,
                        fontWeight:
                          settings.numberOfDecks === num ? "bold" : "normal",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flex: 1,
                        opacity: isAvailable ? 1 : 0.7,
                      }}
                    >
                      {num}
                      {!isAvailable && (
                        <div
                          style={{
                            fontSize: isMobile ? "8px" : "10px",
                            marginTop: "2px",
                          }}
                        >
                          🔒 {SUBSCRIPTION_TIER_NAMES[minTier]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Deck Penetration */}
            <div>
              <label
                htmlFor="deck-penetration"
                style={{
                  fontSize: "14px",
                  color: "#AAA",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Deck Penetration: {settings.deckPenetration}%
                <span
                  style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}
                >
                  (Range: {restrictions.penetrationRange.min}% -{" "}
                  {restrictions.penetrationRange.max}%)
                </span>
              </label>
              <input
                id="deck-penetration"
                type="range"
                min={restrictions.penetrationRange.min}
                max={restrictions.penetrationRange.max}
                step="5"
                value={Math.min(
                  Math.max(
                    settings.deckPenetration,
                    restrictions.penetrationRange.min,
                  ),
                  restrictions.penetrationRange.max,
                )}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deckPenetration: parseInt(e.target.value, 10),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#4A90E2",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "4px",
                }}
              >
                <span>{restrictions.penetrationRange.min}% (Min)</span>
                <span>75% (Good)</span>
                <span>{restrictions.penetrationRange.max}% (Max)</span>
              </div>
              {(restrictions.penetrationRange.min > 30 ||
                restrictions.penetrationRange.max < 95) && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9B59B6",
                    marginTop: "8px",
                    cursor: "pointer",
                  }}
                  onClick={handleUpgradeClick}
                  onKeyDown={(e) => e.key === "Enter" && handleUpgradeClick()}
                  role="button"
                  tabIndex={0}
                >
                  🔒 Upgrade to unlock full penetration range (30%-95%)
                </div>
              )}
            </div>
          </div>

          {/* Dealer Rules */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              👔 Dealer Rules
            </h3>

            <div
              // eslint-disable-next-line sonarjs/no-duplicate-string
              // eslint-disable-next-line sonarjs/no-duplicate-string
              style={{
                // eslint-disable-next-line sonarjs/no-duplicate-string
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                // eslint-disable-next-line sonarjs/no-duplicate-string
                border: isMobile
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: isMobile ? "8px" : "12px",
                padding: isMobile ? "10px" : "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: smallFontSize,
                    fontWeight: "bold",
                    color: "#FFF",
                  }}
                >
                  Dealer Action on Soft 17
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "10px" : "12px",
                    color: "#AAA",
                    marginTop: "4px",
                  }}
                >
                  {settings.dealerHitsSoft17
                    ? "H17 - House Favored"
                    : "S17 - Player Favored"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    dealerHitsSoft17: !settings.dealerHitsSoft17,
                  })
                }
                style={{
                  backgroundColor: settings.dealerHitsSoft17
                    ? "#F44336"
                    : "#4CAF50",
                  color: "#FFF",
                  border: "none",
                  borderRadius: isMobile ? "6px" : "8px",
                  padding: isMobile ? "8px 14px" : "10px 20px",
                  fontSize: smallFontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {settings.dealerHitsSoft17 ? "H17" : "S17"}
              </button>
            </div>
          </div>

          {/* Player Options */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              🎯 Player Options
            </h3>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: isMobile
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: isMobile ? "8px" : "12px",
                padding: isMobile ? "10px" : "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: smallFontSize,
                    fontWeight: "bold",
                    color: "#FFF",
                  }}
                >
                  Late Surrender
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "10px" : "12px",
                    color: "#AAA",
                    marginTop: "4px",
                  }}
                >
                  {settings.lateSurrenderAllowed
                    ? "Enabled - 50% back"
                    : "Disabled"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    lateSurrenderAllowed: !settings.lateSurrenderAllowed,
                  })
                }
                style={{
                  backgroundColor: settings.lateSurrenderAllowed
                    ? "#4CAF50"
                    : "#666",
                  color: "#FFF",
                  border: "none",
                  borderRadius: isMobile ? "6px" : "8px",
                  padding: isMobile ? "8px 14px" : "10px 20px",
                  fontSize: smallFontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {settings.lateSurrenderAllowed ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Payout Rules */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              💰 Payout Rules
            </h3>

            <fieldset style={{ border: "none", padding: 0 }}>
              <legend
                style={{
                  fontSize: "14px",
                  color: "#AAA",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Blackjack Payout
              </legend>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                {[
                  {
                    value: BlackjackPayout.THREE_TO_TWO,
                    label: "3:2",
                    note: "(Standard)",
                  },
                  {
                    value: BlackjackPayout.SIX_TO_FIVE,
                    label: "6:5",
                    note: "(Bad!)",
                  },
                  { value: BlackjackPayout.TWO_TO_ONE, label: "2:1", note: "" },
                  { value: BlackjackPayout.EVEN_MONEY, label: "1:1", note: "" },
                ].map(({ value, label, note }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setSettings({ ...settings, blackjackPayout: value })
                    }
                    style={{
                      backgroundColor:
                        settings.blackjackPayout === value
                          ? "#4A90E2"
                          : "rgba(255, 255, 255, 0.1)",
                      color:
                        settings.blackjackPayout === value
                          ? "#FFF"
                          : value === BlackjackPayout.SIX_TO_FIVE ||
                              value === BlackjackPayout.EVEN_MONEY
                            ? "#F44336"
                            : "#AAA",
                      border: "2px solid",
                      borderColor:
                        settings.blackjackPayout === value
                          ? "#FFF"
                          : BORDER_LIGHT,
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight:
                        settings.blackjackPayout === value ? "bold" : "normal",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {label} {note}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Counting System */}
          <div style={{ marginBottom: sectionMargin }}>
            <h3
              style={{
                fontSize: sectionFontSize,
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: isMobile ? "8px" : "12px",
              }}
            >
              🧮 Counting System
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {(
                Object.keys(COUNTING_SYSTEMS) as Array<
                  keyof typeof COUNTING_SYSTEMS
                >
              ).map((system) => {
                const isAvailable =
                  restrictions.countingSystems.includes(system);
                const minTier = getMinTierForCountingSystem(system);
                return (
                  <button
                    type="button"
                    key={system}
                    onClick={() => {
                      if (isAvailable) {
                        setSettings({
                          ...settings,
                          countingSystem: CountingSystem[system],
                        });
                      } else {
                        handleUpgradeClick();
                      }
                    }}
                    style={{
                      backgroundColor:
                        settings.countingSystem === system
                          ? "rgba(74, 144, 226, 0.3)"
                          : !isAvailable
                            ? LOCKED_BG_LIGHT
                            : "rgba(255, 255, 255, 0.05)",
                      color: isAvailable ? "#FFF" : "#888",
                      border: "2px solid",
                      borderColor:
                        settings.countingSystem === system
                          ? "#4A90E2"
                          : !isAvailable
                            ? LOCKED_BORDER
                            : "rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      opacity: isAvailable ? 1 : 0.7,
                    }}
                    onMouseEnter={(e) => {
                      if (settings.countingSystem !== system && isAvailable) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (settings.countingSystem !== system && isAvailable) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.05)";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{COUNTING_SYSTEMS[system].name}</span>
                      {!isAvailable && <LockIcon tier={minTier} />}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: isAvailable ? "#AAA" : "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {COUNTING_SYSTEMS[system].description}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        fontFamily: "monospace",
                      }}
                    >
                      {COUNTING_SYSTEMS[system].values}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 1,
                backgroundColor: "#4CAF50",
                color: "#FFF",
                border: "none",
                borderRadius: isMobile ? "8px" : "12px",
                padding: isMobile ? "10px" : "14px",
                fontSize: bodyFontSize,
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF50";
              }}
            >
              💾 Save
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#FFF",
                border: isMobile
                  ? "1px solid rgba(255, 255, 255, 0.3)"
                  : "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: isMobile ? "8px" : "12px",
                padding: isMobile ? "10px" : "14px",
                fontSize: bodyFontSize,
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BORDER_LIGHT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
