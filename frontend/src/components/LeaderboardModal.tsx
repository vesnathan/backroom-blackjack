"use client";

import { useState, useMemo, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  useLeaderboard,
  LeaderboardCategory,
  LeaderboardTimePeriod,
  LeaderboardFilters,
  CountingSystem,
} from "@/hooks/useLeaderboard";
import Leaderboard, { LeaderboardEntry } from "./Leaderboard";

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

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChips: number;
  peakChips: number;
  longestStreak: number;
  currentScore: number;
}

// Map frontend category names to GraphQL enum values
const categoryToApiMap: Record<string, LeaderboardCategory> = {
  "current-chips": "CURRENT_CHIPS",
  "peak-chips": "PEAK_CHIPS",
  "longest-streak": "LONGEST_STREAK",
  "high-score": "HIGH_SCORE",
  "perfect-shoes": "PERFECT_SHOES",
  "monthly-high-score": "MONTHLY_HIGH_SCORE",
};

const timePeriodOptions: { id: LeaderboardTimePeriod; label: string }[] = [
  { id: "ALL_TIME", label: "All Time" },
  { id: "MONTHLY", label: "This Month" },
  { id: "WEEKLY", label: "This Week" },
  { id: "DAILY", label: "Today" },
];

const countingSystemOptions: { id: CountingSystem | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Systems" },
  { id: "HI_LO", label: "Hi-Lo" },
  { id: "HI_OPT_I", label: "Hi-Opt I" },
  { id: "HI_OPT_II", label: "Hi-Opt II" },
  { id: "KO", label: "KO" },
  { id: "OMEGA_II", label: "Omega II" },
  { id: "ZEN", label: "Zen" },
];

const deckCountOptions: { id: number | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Decks" },
  { id: 1, label: "1 Deck" },
  { id: 2, label: "2 Decks" },
  { id: 4, label: "4 Decks" },
  { id: 6, label: "6 Decks" },
  { id: 8, label: "8 Decks" },
];

// Filter button/dropdown colors
const FILTER_BG = "rgba(155, 89, 182, 0.2)";
const FILTER_BG_HOVER = "rgba(155, 89, 182, 0.4)";
const FILTER_BORDER = "1px solid rgba(155, 89, 182, 0.4)";
const TRANSITION_EASE = "all 0.2s ease";

type CategoryId =
  | "current-chips"
  | "peak-chips"
  | "longest-streak"
  | "high-score"
  | "perfect-shoes"
  | "monthly-high-score";

export default function LeaderboardModal({
  isOpen,
  onClose,
  currentChips,
  peakChips,
  longestStreak,
  currentScore,
}: LeaderboardModalProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryId>("high-score");
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<LeaderboardTimePeriod>("ALL_TIME");
  const [selectedCountingSystem, setSelectedCountingSystem] = useState<
    CountingSystem | "ALL"
  >("ALL");
  const [selectedDeckCount, setSelectedDeckCount] = useState<number | "ALL">(
    "ALL",
  );
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Responsive sizes
  const padding = isMobile ? "16px" : "32px";
  const headerFontSize = isMobile ? "22px" : "32px";
  const sectionMargin = isMobile ? "12px" : "24px";
  const smallFontSize = isMobile ? "10px" : "12px";

  // Build filters based on selected options
  const filters: LeaderboardFilters | undefined = useMemo(() => {
    const filterObj: LeaderboardFilters = {};

    if (selectedTimePeriod !== "ALL_TIME") {
      filterObj.timePeriod = selectedTimePeriod;
    }
    if (selectedCountingSystem !== "ALL") {
      filterObj.countingSystem = selectedCountingSystem;
    }
    if (selectedDeckCount !== "ALL") {
      filterObj.numberOfDecks = selectedDeckCount;
    }

    // Return undefined if no filters applied
    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [selectedTimePeriod, selectedCountingSystem, selectedDeckCount]);

  // Fetch leaderboard data
  // Use userPool auth for authenticated users, iam (guest) auth for unauthenticated
  const apiCategory = categoryToApiMap[selectedCategory];
  const { data, loading, error } = useLeaderboard(
    apiCategory,
    filters,
    10,
    isAuthenticated,
  );

  if (!isOpen) return null;

  // Transform API data to component format
  const entries: LeaderboardEntry[] =
    data?.entries?.map((entry) => ({
      rank: entry.rank,
      username: entry.username,
      userId: entry.userId,
      value: entry.value,
      patreonTier: entry.subscriptionTier,
      isSeedUser: entry.isSeedUser,
    })) || [];

  const categories = [
    { id: "high-score" as const, label: "High Score", icon: "🏆" },
    { id: "monthly-high-score" as const, label: "Monthly", icon: "📅" },
    { id: "current-chips" as const, label: "Chips", icon: "💰" },
    { id: "peak-chips" as const, label: "Peak", icon: "📈" },
    { id: "longest-streak" as const, label: "Streak", icon: "🔥" },
    { id: "perfect-shoes" as const, label: "Perfect", icon: "✨" },
  ];

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
          maxHeight: "95vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: isMobile ? "500px" : "800px",
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
          {/* Header with close button */}
          <div
            style={{
              display: "flex",
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
              🏆 {isMobile ? "Leaderboard" : "Leaderboards"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: isMobile
                  ? "1px solid rgba(255, 255, 255, 0.3)"
                  : "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: isMobile ? "6px" : "8px",
                padding: isMobile ? "6px 10px" : "8px 16px",
                fontSize: isMobile ? "14px" : "18px",
                cursor: "pointer",
                transition: TRANSITION_EASE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  // eslint-disable-next-line sonarjs/no-duplicate-string
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              ✕
            </button>
          </div>

          {/* Your stats summary - only show for authenticated users */}
          {isAuthenticated && (
            <div
              style={{
                backgroundColor: "rgba(74, 144, 226, 0.1)",
                border: isMobile ? "1px solid #4A90E2" : "2px solid #4A90E2",
                borderRadius: isMobile ? "8px" : "12px",
                padding: isMobile ? "10px" : "16px",
                marginBottom: sectionMargin,
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : "repeat(auto-fit, minmax(150px, 1fr))",
                gap: isMobile ? "8px" : "16px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: smallFontSize,
                    color: "#AAA",
                    marginBottom: "2px",
                  }}
                >
                  Chips
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "20px",
                    fontWeight: "bold",
                    color: "#4CAF50",
                  }}
                >
                  {currentChips.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: smallFontSize,
                    color: "#AAA",
                    marginBottom: "2px",
                  }}
                >
                  Peak
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "20px",
                    fontWeight: "bold",
                    color: "#FFD700",
                  }}
                >
                  {peakChips.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: smallFontSize,
                    color: "#AAA",
                    marginBottom: "2px",
                  }}
                >
                  Streak
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "20px",
                    fontWeight: "bold",
                    color: "#FF6B6B",
                  }}
                >
                  {longestStreak}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: smallFontSize,
                    color: "#AAA",
                    marginBottom: "2px",
                  }}
                >
                  Score
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "20px",
                    fontWeight: "bold",
                    color: "#9B59B6",
                  }}
                >
                  {currentScore.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div style={{ marginBottom: isMobile ? "10px" : "16px" }}>
            <div
              style={{
                display: "flex",
                gap: isMobile ? "4px" : "6px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor:
                      selectedCategory === cat.id
                        ? "#4A90E2"
                        : "rgba(255, 255, 255, 0.1)",
                    color: selectedCategory === cat.id ? "#FFF" : "#AAA",
                    border: isMobile ? "1px solid" : "2px solid",
                    borderColor:
                      selectedCategory === cat.id
                        ? "#FFF"
                        : "rgba(255, 255, 255, 0.2)",
                    borderRadius: isMobile ? "6px" : "10px",
                    padding: isMobile ? "5px 8px" : "8px 14px",
                    fontSize: isMobile ? "10px" : "13px",
                    fontWeight: selectedCategory === cat.id ? "bold" : "normal",
                    cursor: "pointer",
                    transition: TRANSITION_EASE,
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "2px" : "4px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(74, 144, 226, 0.2)";
                      e.currentTarget.style.borderColor = "#4A90E2";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time period filter */}
          <div style={{ marginBottom: isMobile ? "10px" : "16px" }}>
            <div
              style={{
                display: "flex",
                gap: isMobile ? "4px" : "6px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {timePeriodOptions.map((period) => (
                <button
                  type="button"
                  key={period.id}
                  onClick={() => setSelectedTimePeriod(period.id)}
                  style={{
                    backgroundColor:
                      selectedTimePeriod === period.id ? "#9B59B6" : FILTER_BG,
                    color: selectedTimePeriod === period.id ? "#FFF" : "#AAA",
                    border: "1px solid",
                    borderColor:
                      selectedTimePeriod === period.id
                        ? "#FFF"
                        : FILTER_BG_HOVER,
                    borderRadius: isMobile ? "4px" : "6px",
                    padding: isMobile ? "4px 8px" : "6px 12px",
                    fontSize: smallFontSize,
                    fontWeight:
                      selectedTimePeriod === period.id ? "bold" : "normal",
                    cursor: "pointer",
                    transition: TRANSITION_EASE,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTimePeriod !== period.id) {
                      e.currentTarget.style.backgroundColor = FILTER_BG_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTimePeriod !== period.id) {
                      e.currentTarget.style.backgroundColor = FILTER_BG;
                    }
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Counting System & Deck Count filters */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? "10px" : "16px",
              justifyContent: "center",
              marginBottom: sectionMargin,
              flexWrap: "wrap",
            }}
          >
            {/* Counting System dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label
                htmlFor="counting-system-filter"
                style={{ fontSize: "12px", color: "#AAA" }}
              >
                System:
              </label>
              <select
                id="counting-system-filter"
                value={selectedCountingSystem}
                onChange={(e) =>
                  setSelectedCountingSystem(
                    e.target.value as CountingSystem | "ALL",
                  )
                }
                style={{
                  backgroundColor: FILTER_BG,
                  color: "#FFF",
                  border: FILTER_BORDER,
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {countingSystemOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    style={{ backgroundColor: "#1a1a2e", color: "#FFF" }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Decks dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label
                htmlFor="deck-count-filter"
                style={{ fontSize: "12px", color: "#AAA" }}
              >
                Decks:
              </label>
              <select
                id="deck-count-filter"
                value={selectedDeckCount}
                onChange={(e) =>
                  setSelectedDeckCount(
                    e.target.value === "ALL" ? "ALL" : +e.target.value,
                  )
                }
                style={{
                  backgroundColor: FILTER_BG,
                  color: "#FFF",
                  border: FILTER_BORDER,
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {deckCountOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    style={{ backgroundColor: "#1a1a2e", color: "#FFF" }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard display */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#AAA",
                fontSize: "16px",
              }}
            >
              Loading leaderboard...
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#FF6B6B",
                fontSize: "16px",
              }}
            >
              {error}
            </div>
          ) : (
            <Leaderboard
              category={selectedCategory}
              entries={entries}
              currentUserRank={data?.userRank}
              currentUserValue={data?.userValue}
            />
          )}
        </div>
      </div>
    </>
  );
}
