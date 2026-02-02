"use client";

import { useState, useEffect } from "react";
import { DEBUG } from "@/utils/debug";
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_NAMES,
  TIER_BADGE_COLORS,
} from "@backroom-blackjack/shared";
import { client } from "@/lib/amplify";

interface AudioSettings {
  musicVolume: number;
}

type DebugSettings = typeof DEBUG;

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devTestingMode: boolean;
  setDevTestingMode: (enabled: boolean) => void;
  onResetComplete?: () => void;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 30,
};

// Tier options for the selector
const TIER_OPTIONS: { value: string; tier: SubscriptionTier | null }[] = [
  { value: "none", tier: null },
  { value: "BRONZE", tier: SubscriptionTier.Bronze },
  { value: "SILVER", tier: SubscriptionTier.Silver },
  { value: "GOLD", tier: SubscriptionTier.Gold },
  { value: "PLATINUM", tier: SubscriptionTier.Platinum },
];

// Color constants
const WHITE_ALPHA_10 = "rgba(255, 255, 255, 0.1)";
const WHITE_ALPHA_20 = "rgba(255, 255, 255, 0.2)";

// GraphQL mutation for resetting user data
const RESET_USER_DATA = /* GraphQL */ `
  mutation ResetUserData {
    resetUserData {
      id
      chips
      stats {
        totalHandsPlayed
        totalHandsWon
        peakChips
        highScore
      }
      earnedBadgeIds
    }
  }
`;

export default function AdminSettingsModal({
  isOpen,
  onClose,
  devTestingMode,
  setDevTestingMode,
  onResetComplete,
}: AdminSettingsModalProps) {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    DEFAULT_AUDIO_SETTINGS,
  );
  const [debugSettings, setDebugSettings] = useState<DebugSettings>({
    ...DEBUG,
  });
  const [tierOverride, setTierOverride] = useState<string>("none");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("audioSettings");
      if (saved) {
        try {
          setAudioSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load audio settings:", e);
        }
      }

      const savedDebug = localStorage.getItem("debugSettings");
      if (savedDebug) {
        try {
          const parsed = JSON.parse(savedDebug);
          setDebugSettings(parsed);
          // Apply to DEBUG object
          Object.assign(DEBUG, parsed);
        } catch (e) {
          console.error("Failed to load debug settings:", e);
        }
      }

      // Load tier override
      const savedTier = localStorage.getItem("adminTierOverride");
      if (savedTier && savedTier !== "null") {
        setTierOverride(savedTier);
      }
    }
  }, []);

  // Save tier override to localStorage and dispatch event
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminTierOverride", tierOverride);
      window.dispatchEvent(new CustomEvent("adminTierOverrideChanged"));
    }
  }, [tierOverride]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("audioSettings", JSON.stringify(audioSettings));

      // Dispatch custom event so other components can react to volume changes
      window.dispatchEvent(
        new CustomEvent("audioSettingsChanged", { detail: audioSettings }),
      );
    }
  }, [audioSettings]);

  // Save debug settings to localStorage and apply to DEBUG object
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("debugSettings", JSON.stringify(debugSettings));
      // Apply to DEBUG object
      Object.assign(DEBUG, debugSettings);
    }
  }, [debugSettings]);

  if (!isOpen) return null;

  const handleReset = () => {
    setAudioSettings(DEFAULT_AUDIO_SETTINGS);
  };

  const handleResetUserData = async () => {
    setIsResetting(true);
    try {
      await client.graphql({
        query: RESET_USER_DATA,
        authMode: "userPool",
      });
      setResetComplete(true);
      setShowResetConfirm(false);
      // Update local state to match reset values
      onResetComplete?.();
    } catch (error) {
      console.error("Failed to reset user data:", error);
      alert("Failed to reset user data. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

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
          maxHeight: "90vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: "600px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: "3px solid #9C27B0",
            borderRadius: "20px",
            padding: "32px",
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
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#FFF" }}>
              🎛️ Admin Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
                // eslint-disable-next-line sonarjs/no-duplicate-string
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WHITE_ALPHA_10;
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Background Music */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🎵 Background Music
            </h3>
            <div
              style={{
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                border: "2px solid rgba(156, 39, 176, 0.3)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <label
                htmlFor="music-volume"
                style={{ display: "block", width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#AAA",
                    }}
                  >
                    Volume
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#FFF",
                      minWidth: "45px",
                      textAlign: "right",
                    }}
                  >
                    {audioSettings.musicVolume}%
                  </span>
                </div>
                <input
                  id="music-volume"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={audioSettings.musicVolume}
                  onChange={(e) =>
                    setAudioSettings({
                      ...audioSettings,
                      musicVolume: parseInt(e.target.value, 10),
                    })
                  }
                  style={{
                    width: "100%",
                    accentColor: "#4A90E2",
                  }}
                />
              </label>
            </div>
          </div>

          {/* Debug Console Logs */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🐛 Debug Console Logs
            </h3>
            <div
              style={{
                backgroundColor: "rgba(255, 152, 0, 0.1)",
                border: "2px solid rgba(255, 152, 0, 0.3)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {Object.entries(debugSettings).map(([key, value]) => (
                  <label
                    key={key}
                    htmlFor={`debug-${key}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: value ? "#4CAF50" : "#AAA",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <input
                      id={`debug-${key}`}
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setDebugSettings({
                          ...debugSettings,
                          [key]: e.target.checked,
                        })
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#FF9800",
                        cursor: "pointer",
                      }}
                    />
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Dev Testing Mode */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🧪 Dev Testing Mode
            </h3>
            <div
              style={{
                backgroundColor: "rgba(255, 152, 0, 0.1)",
                border: "2px solid rgba(255, 152, 0, 0.3)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#FFF",
                      marginBottom: "4px",
                    }}
                  >
                    Enable Testing Mode
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#AAA",
                      marginTop: "4px",
                    }}
                  >
                    {devTestingMode
                      ? "Test AI decisions with forced hands and probability display"
                      : "Activate to access AI testing scenarios"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDevTestingMode(!devTestingMode)}
                  style={{
                    backgroundColor: devTestingMode
                      ? "#FF9800"
                      : WHITE_ALPHA_10,
                    color: "#FFF",
                    border: "2px solid",
                    borderColor: devTestingMode
                      ? "#FF9800"
                      : "rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "80px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = devTestingMode
                      ? "#F57C00"
                      : WHITE_ALPHA_20;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = devTestingMode
                      ? "#FF9800"
                      : WHITE_ALPHA_10;
                  }}
                >
                  {devTestingMode ? "ON" : "OFF"}
                </button>
              </div>

              {devTestingMode && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#FF9800",
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    backgroundColor: "rgba(255, 152, 0, 0.2)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 152, 0, 0.4)",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    🎯 Testing Mode Active:
                  </div>
                  <ul
                    style={{
                      margin: "4px 0 0 20px",
                      padding: 0,
                      listStyle: "disc",
                    }}
                  >
                    <li>Only 2 AI players (for easier observation)</li>
                    <li>Choose specific test scenarios for each hand</li>
                    <li>
                      Test dealer blackjack, player blackjack, splits, and more
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Tier Override */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              💎 Subscription Tier Override
            </h3>
            <div
              style={{
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                border: "2px solid rgba(156, 39, 176, 0.3)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#AAA",
                  marginBottom: "16px",
                }}
              >
                Override your subscription tier for testing. This only affects
                the local UI display.
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {TIER_OPTIONS.map((option) => {
                  const isSelected = tierOverride === option.value;
                  const tierColor = option.tier
                    ? TIER_BADGE_COLORS[option.tier]
                    : "#6B7280";
                  const tierName = option.tier
                    ? SUBSCRIPTION_TIER_NAMES[option.tier]
                    : "None";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTierOverride(option.value)}
                      style={{
                        backgroundColor: isSelected
                          ? tierColor
                          : WHITE_ALPHA_10,
                        color: "#FFF",
                        border: `2px solid ${isSelected ? tierColor : WHITE_ALPHA_20}`,
                        borderRadius: "8px",
                        padding: "10px 16px",
                        fontSize: "14px",
                        fontWeight: isSelected ? "bold" : "normal",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        minWidth: "90px",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            WHITE_ALPHA_20;
                          e.currentTarget.style.borderColor = tierColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            WHITE_ALPHA_10;
                          e.currentTarget.style.borderColor = WHITE_ALPHA_20;
                        }
                      }}
                    >
                      {tierName}
                    </button>
                  );
                })}
              </div>
              {tierOverride !== "none" && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#9C27B0",
                    backgroundColor: "rgba(156, 39, 176, 0.2)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(156, 39, 176, 0.4)",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    ⚠️ Tier Override Active
                  </div>
                  <div>
                    UI will display as if you have{" "}
                    <strong>
                      {
                        SUBSCRIPTION_TIER_NAMES[
                          TIER_OPTIONS.find((o) => o.value === tierOverride)
                            ?.tier ?? SubscriptionTier.None
                        ]
                      }
                    </strong>{" "}
                    subscription. This does not affect actual permissions.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reset User Data */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🗑️ Reset User Data
            </h3>
            <div
              style={{
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                border: "2px solid rgba(244, 67, 54, 0.3)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              {resetComplete ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#4CAF50",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  ✓ Data reset successfully! Reloading...
                </div>
              ) : showResetConfirm ? (
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#F44336",
                      marginBottom: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    ⚠️ Are you sure? This will permanently reset:
                  </div>
                  <ul
                    style={{
                      margin: "0 0 16px 20px",
                      padding: 0,
                      listStyle: "disc",
                      fontSize: "13px",
                      color: "#AAA",
                    }}
                  >
                    <li>Chips → 1,000</li>
                    <li>All statistics → 0</li>
                    <li>All earned badges → removed</li>
                    <li>High score → 0</li>
                    <li>Longest streak → 0</li>
                  </ul>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      style={{
                        flex: 1,
                        backgroundColor: WHITE_ALPHA_10,
                        color: "#FFF",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetUserData}
                      disabled={isResetting}
                      style={{
                        flex: 1,
                        backgroundColor: "#F44336",
                        color: "#FFF",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        cursor: isResetting ? "wait" : "pointer",
                        opacity: isResetting ? 0.7 : 1,
                      }}
                    >
                      {isResetting ? "Resetting..." : "Yes, Reset Everything"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#AAA",
                      marginBottom: "16px",
                    }}
                  >
                    Reset all your game data including chips, statistics, and
                    badges. This action cannot be undone.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(244, 67, 54, 0.2)",
                      color: "#F44336",
                      border: "2px solid #F44336",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(244, 67, 54, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(244, 67, 54, 0.2)";
                    }}
                  >
                    🗑️ Reset All My Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "2px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#AAA",
                lineHeight: "1.6",
              }}
            >
              <div>
                💡 Settings are saved automatically to your browser and will
                persist between sessions.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 152, 0, 0.2)",
                color: "#FF9800",
                border: "2px solid #FF9800",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 152, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 152, 0, 0.2)";
              }}
            >
              🔄 Reset to Defaults
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "#9C27B0",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#7B1FA2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#9C27B0";
              }}
            >
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Export utility function to get music volume
export function getMusicVolume(): number {
  if (typeof window === "undefined")
    return DEFAULT_AUDIO_SETTINGS.musicVolume / 100;

  const saved = localStorage.getItem("audioSettings");
  if (saved) {
    try {
      const settings = JSON.parse(saved) as AudioSettings;
      return settings.musicVolume / 100;
    } catch {
      return DEFAULT_AUDIO_SETTINGS.musicVolume / 100;
    }
  }
  return DEFAULT_AUDIO_SETTINGS.musicVolume / 100;
}
