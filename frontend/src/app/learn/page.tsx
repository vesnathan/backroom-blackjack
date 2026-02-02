"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Chip } from "@nextui-org/react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  COUNTING_SYSTEMS,
  CountingSystemData,
  CARD_RANKS,
  getRankValueIndex,
  getCardRank,
} from "@/data/tutorials/countingSystems";
import { CountingSystem } from "@/types/gameSettings";
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_NAMES,
  TIER_BADGE_COLORS,
  isAtLeastTier,
} from "@backroom-blackjack/shared";

// Difficulty badge colors
const DIFFICULTY_COLORS = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
};

// Card suit symbols for display
const SUIT_SYMBOLS: Record<string, string> = {
  H: "\u2665", // Hearts
  D: "\u2666", // Diamonds
  C: "\u2663", // Clubs
  S: "\u2660", // Spades
};

const SUIT_COLORS: Record<string, string> = {
  H: "#E53935",
  D: "#E53935",
  C: "#1E1E1E",
  S: "#1E1E1E",
};

export default function LearnPage() {
  const router = useRouter();
  const { tier } = useSubscription();
  const [selectedSystem, setSelectedSystem] = useState<CountingSystem | null>(
    null,
  );
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const systems = Object.values(COUNTING_SYSTEMS);
  const currentSystemData = selectedSystem
    ? COUNTING_SYSTEMS[selectedSystem]
    : null;

  // Check if user can access a system
  const canAccess = (system: CountingSystemData) => {
    // Free (None) tier systems are always accessible
    if (system.requiredTier === SubscriptionTier.None) {
      return true;
    }
    return isAtLeastTier(tier, system.requiredTier);
  };

  // Handle practice answer submission
  const handleSubmitAnswer = () => {
    if (!currentSystemData) return;
    const hand = currentSystemData.practiceHands[currentHandIndex];
    const isCorrect = parseInt(userAnswer, 10) === hand.expectedCount;

    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  // Move to next practice hand
  const handleNextHand = () => {
    if (!currentSystemData) return;
    if (currentHandIndex < currentSystemData.practiceHands.length - 1) {
      setCurrentHandIndex((prev) => prev + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      // Finished all hands
      setPracticeMode(false);
      setCurrentHandIndex(0);
      setUserAnswer("");
      setShowResult(false);
    }
  };

  // Reset practice mode
  const startPractice = () => {
    setPracticeMode(true);
    setCurrentHandIndex(0);
    setUserAnswer("");
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Card Counting Tutorials
            </h1>
            <p className="text-gray-400">
              Learn different counting systems to improve your edge
            </p>
          </div>
          <Button
            color="warning"
            variant="flat"
            onClick={() => router.push("/")}
          >
            Back to Game
          </Button>
        </div>

        {/* System Selection or Detail View */}
        {!selectedSystem ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((system) => {
              const hasAccess = canAccess(system);
              return (
                <Card
                  key={system.id}
                  className={`bg-gray-800/80 border ${
                    hasAccess
                      ? "border-gray-700 hover:border-yellow-500 cursor-pointer"
                      : "border-gray-700/50 opacity-70"
                  } transition-all`}
                  isPressable={hasAccess}
                  onPress={() => hasAccess && setSelectedSystem(system.id)}
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-white">
                        {system.name}
                      </h3>
                      <div className="flex gap-2">
                        <Chip
                          size="sm"
                          style={{
                            backgroundColor:
                              DIFFICULTY_COLORS[system.difficulty],
                          }}
                        >
                          {system.difficulty}
                        </Chip>
                        {system.requiredTier !== SubscriptionTier.None && (
                          <Chip
                            size="sm"
                            style={{
                              backgroundColor:
                                TIER_BADGE_COLORS[system.requiredTier],
                              color: "#000",
                            }}
                          >
                            {SUBSCRIPTION_TIER_NAMES[system.requiredTier]}+
                          </Chip>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      {system.shortDescription}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={
                          system.isBalanced ? "text-green-400" : "text-blue-400"
                        }
                      >
                        {system.isBalanced ? "Balanced" : "Unbalanced"}
                      </span>
                      {system.trueCountRequired && (
                        <span className="text-yellow-400">
                          True Count Required
                        </span>
                      )}
                    </div>

                    {!hasAccess && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-yellow-400 text-sm">
                          Upgrade to{" "}
                          {SUBSCRIPTION_TIER_NAMES[system.requiredTier]} to
                          unlock
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Detail View for Selected System */
          <div>
            <Button
              variant="light"
              className="mb-6 text-gray-400"
              onClick={() => {
                setSelectedSystem(null);
                setPracticeMode(false);
              }}
            >
              &larr; Back to Systems
            </Button>

            {currentSystemData && !practiceMode && (
              <div className="space-y-8">
                {/* System Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {currentSystemData.name}
                    </h2>
                    <div className="flex gap-3">
                      <Chip
                        style={{
                          backgroundColor:
                            DIFFICULTY_COLORS[currentSystemData.difficulty],
                        }}
                      >
                        {currentSystemData.difficulty}
                      </Chip>
                      <Chip
                        color={
                          currentSystemData.isBalanced ? "success" : "primary"
                        }
                      >
                        {currentSystemData.isBalanced
                          ? "Balanced"
                          : "Unbalanced"}
                      </Chip>
                    </div>
                  </div>
                  <Button color="warning" onClick={startPractice}>
                    Start Practice
                  </Button>
                </div>

                {/* Card Value Table */}
                <Card className="bg-gray-800/80 border border-gray-700">
                  <CardBody className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Card Values
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-gray-400 pb-3">
                              Card
                            </th>
                            {CARD_RANKS.map((rank) => (
                              <th
                                key={rank}
                                className="text-center text-white pb-3 px-2"
                              >
                                {rank}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-gray-400 py-2">Value</td>
                            {CARD_RANKS.map((rank) => {
                              const value =
                                currentSystemData.cardValues[
                                  getRankValueIndex(rank)
                                ];
                              return (
                                <td
                                  key={rank}
                                  className={`text-center py-2 px-2 font-bold ${
                                    value > 0
                                      ? "text-green-400"
                                      : value < 0
                                        ? "text-red-400"
                                        : "text-gray-500"
                                  }`}
                                >
                                  {value > 0 ? `+${value}` : value}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>

                {/* Full Description */}
                <Card className="bg-gray-800/80 border border-gray-700">
                  <CardBody className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      How It Works
                    </h3>
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {currentSystemData.fullDescription}
                    </p>
                  </CardBody>
                </Card>

                {/* Tips */}
                <Card className="bg-gray-800/80 border border-gray-700">
                  <CardBody className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Tips for Success
                    </h3>
                    <ul className="space-y-3">
                      {currentSystemData.tips.map((tip, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-1">&#8226;</span>
                          <span className="text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Practice Mode */}
            {currentSystemData && practiceMode && (
              <Card className="bg-gray-800/80 border border-gray-700">
                <CardBody className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                      Practice: Hand {currentHandIndex + 1} of{" "}
                      {currentSystemData.practiceHands.length}
                    </h3>
                    <Chip color="warning">
                      Score: {score.correct}/{score.total}
                    </Chip>
                  </div>

                  {/* Cards Display */}
                  <div className="flex gap-4 justify-center mb-8">
                    {currentSystemData.practiceHands[
                      currentHandIndex
                    ].cards.map((cardStr, idx) => {
                      const rank = getCardRank(cardStr);
                      const suit = cardStr[cardStr.length - 1];
                      return (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={idx}
                          className="w-20 h-28 bg-white rounded-lg flex flex-col items-center justify-center shadow-lg"
                        >
                          <span
                            className="text-2xl font-bold"
                            style={{ color: SUIT_COLORS[suit] }}
                          >
                            {rank}
                          </span>
                          <span
                            className="text-3xl"
                            style={{ color: SUIT_COLORS[suit] }}
                          >
                            {SUIT_SYMBOLS[suit]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Input */}
                  {!showResult ? (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">
                        What is the running count for these cards?
                      </p>
                      <div className="flex justify-center gap-4 items-center">
                        <input
                          type="number"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-24 h-12 text-center text-2xl bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="0"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSubmitAnswer()
                          }
                        />
                        <Button
                          color="success"
                          size="lg"
                          onClick={handleSubmitAnswer}
                          isDisabled={userAnswer === ""}
                        >
                          Check
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {parseInt(userAnswer, 10) ===
                      currentSystemData.practiceHands[currentHandIndex]
                        .expectedCount ? (
                        <div className="text-green-400 text-2xl font-bold mb-4">
                          Correct!
                        </div>
                      ) : (
                        <div className="text-red-400 text-2xl font-bold mb-4">
                          Incorrect - The answer is{" "}
                          {
                            currentSystemData.practiceHands[currentHandIndex]
                              .expectedCount
                          }
                        </div>
                      )}
                      <p className="text-gray-400 mb-6">
                        {currentSystemData.practiceHands[currentHandIndex].hint}
                      </p>
                      <Button
                        color="warning"
                        size="lg"
                        onClick={handleNextHand}
                      >
                        {currentHandIndex <
                        currentSystemData.practiceHands.length - 1
                          ? "Next Hand"
                          : "Finish Practice"}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
