"use client";

import { useState } from "react";
import {
  TestScenario,
  TEST_SCENARIOS,
  getScenarioCategories,
  getScenariosByCategory,
} from "@/types/testScenarios";
import { Rank, Suit } from "@/types/game";

interface TestScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: TestScenario | null) => void;
}

const CATEGORY_LABELS: Record<TestScenario["category"], string> = {
  basic: "🎯 Basic Strategy",
  split: "✂️ Splitting",
  double: "2️⃣ Double Down",
  surrender: "🏳️ Surrender",
  insurance: "🛡️ Insurance",
  "soft-hands": "🎴 Soft Hands",
};

const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const SUITS: { value: Suit; symbol: string; color: string }[] = [
  { value: "H", symbol: "♥", color: "#e53935" },
  { value: "D", symbol: "♦", color: "#e53935" },
  { value: "C", symbol: "♣", color: "#333" },
  { value: "S", symbol: "♠", color: "#333" },
];

interface CardSelection {
  rank: Rank | null;
  suit: Suit | null;
}

// Style constants
const BG_ORANGE = "#FF9800";
const BORDER_ORANGE_SOLID = "2px solid #FF9800";
const BG_WHITE_05 = "rgba(255, 255, 255, 0.05)";
const BG_WHITE_10 = "rgba(255, 255, 255, 0.1)";
const BG_WHITE_90 = "rgba(255, 255, 255, 0.9)";
const BORDER_WHITE_20 = "2px solid rgba(255, 255, 255, 0.2)";

// Card picker component - defined outside to avoid unstable nested component
function CardPicker({
  label,
  selection,
  onSelect,
}: {
  label: string;
  selection: CardSelection;
  onSelect: (sel: CardSelection) => void;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "14px", color: "#AAA", marginBottom: "8px" }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        {RANKS.map((rank) => (
          <button
            key={rank}
            type="button"
            onClick={() => onSelect({ ...selection, rank })}
            style={{
              width: "36px",
              height: "36px",
              backgroundColor:
                selection.rank === rank ? BG_ORANGE : BG_WHITE_10,
              color: "#FFF",
              border:
                selection.rank === rank ? BORDER_ORANGE_SOLID : BORDER_WHITE_20,
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {rank}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {SUITS.map(({ value, symbol, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect({ ...selection, suit: value })}
            style={{
              width: "44px",
              height: "36px",
              backgroundColor:
                selection.suit === value ? BG_ORANGE : BG_WHITE_90,
              color: selection.suit === value ? "#FFF" : color,
              border:
                selection.suit === value
                  ? BORDER_ORANGE_SOLID
                  : BORDER_WHITE_20,
              borderRadius: "6px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
      {selection.rank && selection.suit && (
        <div style={{ marginTop: "8px", fontSize: "16px", color: "#4CAF50" }}>
          Selected: {selection.rank}
          {SUITS.find((s) => s.value === selection.suit)?.symbol}
        </div>
      )}
    </div>
  );
}

export default function TestScenarioSelector({
  isOpen,
  onClose,
  onSelectScenario,
}: TestScenarioSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    TestScenario["category"] | "all"
  >("all");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [card1, setCard1] = useState<CardSelection>({
    rank: null,
    suit: null,
  });
  const [card2, setCard2] = useState<CardSelection>({
    rank: null,
    suit: null,
  });
  const [dealerCard, setDealerCard] = useState<CardSelection>({
    rank: null,
    suit: null,
  });

  const resetCustomPicker = () => {
    setCard1({ rank: null, suit: null });
    setCard2({ rank: null, suit: null });
    setDealerCard({ rank: null, suit: null });
    setShowCustomPicker(false);
  };

  if (!isOpen) return null;

  const categories = getScenarioCategories();
  const displayedScenarios =
    selectedCategory === "all"
      ? TEST_SCENARIOS
      : getScenariosByCategory(selectedCategory);

  const handleSelectScenario = (scenario: TestScenario) => {
    onSelectScenario(scenario);
    onClose();
  };

  const handleRandomHand = () => {
    onSelectScenario(null);
    onClose();
  };

  const handleCustomHand = () => {
    if (!card1.rank || !card1.suit || !card2.rank || !card2.suit) return;

    const randomRank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)].value;

    const customScenario: TestScenario = {
      id: "custom-hand",
      name: "Custom Hand",
      description: "Player-selected cards",
      category: "basic",
      dealerUpCard:
        dealerCard.rank && dealerCard.suit
          ? { rank: dealerCard.rank, suit: dealerCard.suit }
          : { rank: randomRank, suit: randomSuit },
      playerHands: [
        { rank: card1.rank, suit: card1.suit },
        { rank: card2.rank, suit: card2.suit },
      ],
    };

    onSelectScenario(customScenario);
    resetCustomPicker();
    onClose();
  };

  const isCustomHandValid =
    card1.rank && card1.suit && card2.rank && card2.suit;

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
          zIndex: 10000,
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
          zIndex: 10001,
          maxHeight: "90vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: "800px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: "3px solid #FF9800",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#FFF" }}>
              🧪 Select Test Scenario
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
                e.currentTarget.style.backgroundColor = BG_WHITE_10;
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

          {/* Random Hand Button */}
          <button
            type="button"
            onClick={handleRandomHand}
            style={{
              width: "100%",
              backgroundColor: "#4CAF50",
              color: "#FFF",
              border: "none",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }}
          >
            🎲 Random Hand (Normal Play)
          </button>

          {/* Custom Hand Button */}
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            style={{
              width: "100%",
              backgroundColor: showCustomPicker ? BG_ORANGE : "#2196F3",
              color: "#FFF",
              border: "none",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "24px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = showCustomPicker
                ? "#F57C00"
                : "#1976D2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showCustomPicker
                ? BG_ORANGE
                : "#2196F3";
            }}
          >
            🃏 {showCustomPicker ? "Hide Card Picker" : "Choose My Cards"}
          </button>

          {/* Custom Card Picker */}
          {showCustomPicker && (
            <div
              style={{
                backgroundColor: BG_WHITE_05,
                border: BORDER_ORANGE_SOLID,
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: BG_ORANGE,
                  marginBottom: "16px",
                }}
              >
                Pick Your Hole Cards
              </h3>

              <CardPicker
                label="First Card"
                selection={card1}
                onSelect={setCard1}
              />

              <CardPicker
                label="Second Card"
                selection={card2}
                onSelect={setCard2}
              />

              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  paddingTop: "16px",
                  marginTop: "8px",
                }}
              >
                <CardPicker
                  label="Dealer Up Card (optional - random if not selected)"
                  selection={dealerCard}
                  onSelect={setDealerCard}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleCustomHand}
                  disabled={!isCustomHandValid}
                  style={{
                    flex: 1,
                    backgroundColor: isCustomHandValid ? "#4CAF50" : "#666",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: isCustomHandValid ? "pointer" : "not-allowed",
                  }}
                >
                  ✓ Deal These Cards
                </button>
                <button
                  type="button"
                  onClick={resetCustomPicker}
                  style={{
                    backgroundColor: BG_WHITE_10,
                    color: "#FFF",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "12px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#AAA",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Filter by Category
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                style={{
                  backgroundColor:
                    selectedCategory === "all" ? BG_ORANGE : BG_WHITE_10,
                  color: "#FFF",
                  border: "2px solid",
                  borderColor:
                    selectedCategory === "all"
                      ? BG_ORANGE
                      : "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: selectedCategory === "all" ? "bold" : "normal",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                All Scenarios
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    backgroundColor:
                      selectedCategory === category ? BG_ORANGE : BG_WHITE_10,
                    color: "#FFF",
                    border: "2px solid",
                    borderColor:
                      selectedCategory === category
                        ? BG_ORANGE
                        : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight:
                      selectedCategory === category ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxHeight: "400px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {displayedScenarios.map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                style={{
                  backgroundColor: BG_WHITE_05,
                  color: "#FFF",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 152, 0, 0.2)";
                  e.currentTarget.style.borderColor = BG_ORANGE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = BG_WHITE_05;
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {scenario.name}
                  </div>
                  {scenario.expectedAction && (
                    <div
                      style={{
                        backgroundColor: "rgba(74, 144, 226, 0.3)",
                        color: "#4A90E2",
                        border: "1px solid #4A90E2",
                        borderRadius: "6px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {scenario.expectedAction === "H" && "HIT"}
                      {scenario.expectedAction === "S" && "STAND"}
                      {scenario.expectedAction === "D" && "DOUBLE"}
                      {scenario.expectedAction === "SP" && "SPLIT"}
                      {scenario.expectedAction === "SU" && "SURRENDER"}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                    marginBottom: "8px",
                  }}
                >
                  {scenario.description}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: BG_WHITE_10,
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    {CATEGORY_LABELS[scenario.category]}
                  </span>
                  <span
                    style={{
                      backgroundColor: BG_WHITE_10,
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    Dealer: {scenario.dealerUpCard.rank}
                    {scenario.dealerUpCard.suit === "H" && "♥"}
                    {scenario.dealerUpCard.suit === "D" && "♦"}
                    {scenario.dealerUpCard.suit === "C" && "♣"}
                    {scenario.dealerUpCard.suit === "S" && "♠"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
