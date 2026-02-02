"use client";

import { useEffect, useState, useCallback } from "react";
import { GameSettings, DEFAULT_GAME_SETTINGS } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import { PitBossCharacter } from "@/data/pitBossCharacters";
import {
  PlayerHand,
  AIPlayer,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
  GamePhase,
} from "@/types/gameState";
import { getCardPosition } from "@/utils/cardPositions";
import { useGameTimeouts } from "@/hooks/useGameTimeouts";
import { useDebugLogging } from "@/hooks/useDebugLogging";
import { useGameShoe } from "@/hooks/useGameShoe";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { useHandRecording } from "@/hooks/useHandRecording";
import { useBettingActions } from "@/hooks/useBettingActions";
import { useConversationHandlers } from "@/hooks/useConversationHandlers";
import { useGameActions } from "@/hooks/useGameActions";
import { useSuspicionDecay } from "@/hooks/useSuspicionDecay";
import { useDealerSuspicion } from "@/hooks/useDealerSuspicion";
import { useWongingDetection } from "@/hooks/useWongingDetection";
import { useDealerChange } from "@/hooks/useDealerChange";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { useConversationTriggers } from "@/hooks/useConversationTriggers";
import { usePitBossMovement } from "@/hooks/usePitBossMovement";
import { useAutoStartHand } from "@/hooks/useAutoStartHand";
import { useGameInteractions } from "@/hooks/useGameInteractions";
import { useRoundEndPhase } from "@/hooks/useRoundEndPhase";
import { useDealerTurnPhase } from "@/hooks/useDealerTurnPhase";
import { useResolvingPhase } from "@/hooks/useResolvingPhase";
import { useAITurnsPhase } from "@/hooks/useAITurnsPhase";
import { useDealingPhase } from "@/hooks/useDealingPhase";
import { useInsurancePhase } from "@/hooks/useInsurancePhase";
import { useHeatMap } from "@/hooks/useHeatMap";
import { useDealerCallouts } from "@/hooks/useDealerCallouts";
import { usePitBossWarnings } from "@/hooks/usePitBossWarnings";
import { useBadgeIntegration } from "@/hooks/useBadgeIntegration";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBadgeSyncToBackend } from "@/hooks/useBadgeSyncToBackend";
import { useChipsSync } from "@/hooks/useChipsSync";
import { calculateDecksRemaining, calculateTrueCount } from "@/lib/deck";
import BlackjackGameUI from "@/components/BlackjackGameUI";
import BackgroundMusic from "@/components/BackgroundMusic";
import { WelcomeModal } from "@/components/WelcomeModal";
import { AuthModal } from "@/components/auth/AuthModal";
import AdminSettingsModal from "@/components/AdminSettingsModal";
import CountPeekModal from "@/components/CountPeekModal";
import CountPeekConfirmation from "@/components/CountPeekConfirmation";
import BackoffModal from "@/components/BackoffModal";
import SubscribeBannerModal from "@/components/SubscribeBannerModal";
import ChatPanel from "@/components/chat/ChatPanel";
import { BadgeBar } from "@/components/badges";
import BadgeEarnedAnimation from "@/components/badges/BadgeEarnedAnimation";
import { InviteFriend } from "@/components/InviteFriend";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { debugLog } from "@/utils/debug";
import { clearAllConversationColors } from "@/utils/conversationColorManager";
import { TestScenario } from "@/types/testScenarios";
import TestScenarioSelector from "@/components/TestScenarioSelector";
import { GameStateProvider } from "@/contexts/GameStateContext";
import { UIStateProvider } from "@/contexts/UIStateContext";
import { GameActionsProvider } from "@/contexts/GameActionsContext";

export default function GamePage() {
  // Auth state
  const { isAuthenticated, isAdmin, refresh: refreshAuth } = useAuth();
  const { isSubscribed } = useSubscription();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Welcome modal state
  const [showWelcome, setShowWelcome] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);

  // Mobile detection for initialization
  const isMobileMode = useIsMobile();

  // Game settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    DEFAULT_GAME_SETTINGS,
  );

  // Custom hooks
  const { registerTimeout, clearAllTimeouts } = useGameTimeouts();
  const { debugLogs, showDebugLog, setShowDebugLog, clearDebugLogs } =
    useDebugLogging();

  const {
    shoe,
    setShoe,
    cardsDealt,
    setCardsDealt,
    runningCount,
    setRunningCount,
    shoesDealt,
    setShoesDealt,
    dealCardFromShoe,
  } = useGameShoe(gameSettings);

  const {
    playerChips,
    setPlayerChips,
    playerHand,
    setPlayerHand,
    currentBet,
    setCurrentBet,
    previousBet,
    setPreviousBet,
    minBet,
    maxBet,
    currentScore,
    setCurrentScore,
    currentStreak,
    setCurrentStreak,
    longestStreak,
    setLongestStreak,
    peakChips,
    setPeakChips,
    scoreMultiplier,
    setScoreMultiplier,
    sessionStats,
    getSessionNetProfit,
    getSessionWinRate,
    awardCorrectDecisionPoints,
    resetStreak,
  } = usePlayerHand();

  // Sync chips with backend (load on mount, save on change)
  const { chipsLoading } = useChipsSync({ setPlayerChips, playerChips });

  // Event-sourced hand recording for granular analytics
  const { recordHand, addDecision } = useHandRecording();

  // AI players state
  const [aiPlayers, setAIPlayers] = useState<AIPlayer[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // Dealer character state
  const [currentDealer, setCurrentDealer] = useState<DealerCharacter | null>(
    null,
  );
  const [dealerChangeInterval] = useState(
    () => Math.floor(Math.random() * 3) + 8,
  ); // 8-10 shoes

  // Pit boss character state
  const [currentPitBoss, setCurrentPitBoss] = useState<PitBossCharacter | null>(
    null,
  );

  // Insurance state
  const [playerInsuranceBet, setPlayerInsuranceBet] = useState(0);
  const [insuranceOffered, setInsuranceOffered] = useState(false);

  // Badges/Achievements state
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [animatingBadgeId, setAnimatingBadgeId] = useState<string | null>(null);

  // Sync badges with backend for authenticated users (must be before useBadgeIntegration)
  const { badgesLoading } = useBadgeSyncToBackend({
    earnedBadgeIds,
    setEarnedBadgeIds,
  });

  // Badge/achievement tracking - watches game stats and awards badges
  useBadgeIntegration({
    sessionStats,
    longestStreak,
    peakChips,
    currentChips: playerChips,
    perfectShoes: 0, // TODO: Track perfect shoes (no incorrect decisions in a shoe)
    earnedBadgeIds,
    setEarnedBadgeIds,
    hasUsedCountingSystem: true, // Always true in card counting trainer context
    badgesLoading, // Don't check badges until they're loaded from backend
    onBadgeEarned: (badgeId) => {
      // Only show animation if not already showing one
      if (!animatingBadgeId) {
        setAnimatingBadgeId(badgeId);
      }
    },
  });

  // UI state
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [suspicionLevel, setSuspicionLevel] = useState(0); // Pit boss attention (0-100)
  const [dealerSuspicion, setDealerSuspicion] = useState(0); // Dealer suspicion (0-100) - feeds into pit boss attention
  const [pitBossDistance, setPitBossDistance] = useState(30); // 0-100, higher = closer (more dangerous), start farther away
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [winLossBubbles, setWinLossBubbles] = useState<WinLossBubbleData[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [playerSociability, setPlayerSociability] = useState(50); // 0-100: how friendly/responsive player has been
  const [handNumber, setHandNumber] = useState(0);

  // Bet history tracking for counting detection (last 10 bets)
  const [betHistory, setBetHistory] = useState<
    Array<{ bet: number; trueCount: number }>
  >([]);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showStrategyCard, setShowStrategyCard] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showCountPeek, setShowCountPeek] = useState(false);
  const [showSessionStats, setShowSessionStats] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showSubscribeBanner, setShowSubscribeBanner] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [devTestingMode, setDevTestingMode] = useState(false);
  const [showTestScenarioSelector, setShowTestScenarioSelector] =
    useState(false);
  const [selectedTestScenario, setSelectedTestScenario] =
    useState<TestScenario | null>(null);
  const [showCountPeekConfirmation, setShowCountPeekConfirmation] =
    useState(false);
  const [showCountPeekResult, setShowCountPeekResult] = useState(false);
  const [showPenaltyFlash, setShowPenaltyFlash] = useState(false);
  const [showBackoffModal, setShowBackoffModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [strategyCardUsedThisHand, setStrategyCardUsedThisHand] =
    useState(false);
  const [playerSeat, setPlayerSeat] = useState<number | null>(null); // null means not seated

  // Action bubbles and turn tracking
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(
    null,
  ); // -1 = player, 0+ = AI index
  const [playerActions, setPlayerActions] = useState<
    Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
  >(new Map());
  const [playersFinished, setPlayersFinished] = useState<Set<number>>(
    new Set(),
  ); // Track which AI players have finished
  const [playerFinished, setPlayerFinished] = useState<boolean>(false); // Track if human player has finished
  const [blackjackCelebratedPlayers, setBlackjackCelebratedPlayers] = useState<
    Set<number>
  >(new Set()); // Track AI players who already celebrated blackjack during dealing

  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);

  // Dealer callouts
  const [dealerCallout, setDealerCallout] = useState<string | null>(null);

  // Track previous hand states for in-hand reactions
  // const prevAIHandsRef = useRef<Map<string, number>>(new Map()); // TODO: Use for reaction tracking

  // Game interactions hook - provides conversation and speech bubble functions
  const { triggerConversation, addSpeechBubble, showEndOfHandReactions } =
    useGameInteractions({
      setSpeechBubbles,
      registerTimeout,
      aiPlayers,
      dealerHand,
      currentDealer,
      devTestingMode,
      blackjackCelebratedPlayers,
    });

  // Wrapper that records decision AND updates streak/score
  const handleDecision = useCallback(
    (action: string, correctAction: string) => {
      // Record for backend analytics
      addDecision(action, correctAction);

      // Update streak based on whether decision was correct
      if (action === correctAction) {
        awardCorrectDecisionPoints();
      } else {
        resetStreak();
      }
    },
    [addDecision, awardCorrectDecisionPoints, resetStreak],
  );

  // Game actions hook - provides startNewRound, dealInitialCards, hit, stand, doubleDown, split, surrender
  const {
    startNewRound,
    dealInitialCards,
    hit,
    stand,
    doubleDown,
    split,
    surrender,
  } = useGameActions({
    phase,
    playerSeat,
    playerHand,
    dealerHand,
    aiPlayers,
    shoe,
    cardsDealt,
    runningCount,
    shoesDealt,
    gameSettings,
    playerChips,
    selectedTestScenario,
    setPhase,
    setCurrentBet,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setSpeechBubbles,
    setAIPlayers,
    setFlyingCards,
    setPlayerActions,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    setInsuranceOffered,
    setActivePlayerIndex,
    setPlayerFinished,
    setPlayerChips,
    dealCardFromShoe,
    registerTimeout,
    getCardPosition: (
      type: "ai" | "player" | "dealer" | "shoe",
      _aiPlayers?: AIPlayer[],
      _playerSeat?: number | null,
      index?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, index, cardIndex),
    addSpeechBubble,
    showEndOfHandReactions,
    addDecision: handleDecision,
  });

  // Calculate true count for bet tracking
  const decksRemaining = calculateDecksRemaining(
    gameSettings.numberOfDecks * 52,
    cardsDealt,
  );
  const trueCount =
    decksRemaining > 0 ? calculateTrueCount(runningCount, decksRemaining) : 0;

  // Betting actions hook
  const { handleConfirmBet, handleClearBet, handleBetChange } =
    useBettingActions({
      currentBet,
      setCurrentBet,
      minBet,
      maxBet,
      playerChips,
      setPlayerChips,
      phase,
      playerSeat,
      aiPlayers,
      setPhase,
      setDealerRevealed,
      setPlayerHand,
      setDealerHand,
      setPreviousBet,
      setSpeechBubbles,
      setAIPlayers,
      dealInitialCards,
      registerTimeout,
      trueCount,
      setBetHistory,
    });

  // Detect if player is counting cards (varying bet with count)
  // Check correlation between bet size and true count over last 10 hands
  const isPlayerCounting =
    betHistory.length >= 5 &&
    (() => {
      // Calculate correlation between bets and true counts
      const avgBet =
        betHistory.reduce((sum, h) => sum + h.bet, 0) / betHistory.length;
      const avgCount =
        betHistory.reduce((sum, h) => sum + h.trueCount, 0) / betHistory.length;

      let correlation = 0;
      betHistory.forEach((hand) => {
        const betDiff = hand.bet - avgBet;
        const countDiff = hand.trueCount - avgCount;
        correlation += betDiff * countDiff;
      });

      // Positive correlation > threshold = counting
      // If player consistently bets more when count is higher, they're counting
      const isCorrelated = correlation > minBet * betHistory.length * 0.5;

      if (isCorrelated) {
        debugLog(
          "insurance",
          `Player IS counting (correlation: ${correlation.toFixed(2)})`,
        );
      }

      return isCorrelated;
    })();

  // Conversation handlers hook
  const { handleConversationResponse, handleConversationIgnore } =
    useConversationHandlers({
      activeConversation,
      setActiveConversation,
      setSuspicionLevel,
      setPlayerSociability,
      setDealerSuspicion,
      playerSeat,
      currentDealer,
      isPlayerCounting,
      addSpeechBubble,
    });

  // Insurance handlers
  const handleTakeInsurance = useCallback(() => {
    const insuranceCost = Math.floor(currentBet / 2);
    debugLog(
      "insurance",
      `=== PLAYER TAKES INSURANCE for $${insuranceCost} ===`,
    );

    if (playerChips >= insuranceCost) {
      setPlayerInsuranceBet(insuranceCost);
      setPlayerChips(playerChips - insuranceCost);
      setInsuranceOffered(false);
      debugLog(
        "insurance",
        `Player chips after insurance: $${playerChips - insuranceCost}`,
      );
    } else {
      debugLog("insurance", "Player cannot afford insurance!");
    }
  }, [
    currentBet,
    playerChips,
    setPlayerChips,
    setPlayerInsuranceBet,
    setInsuranceOffered,
  ]);

  const handleDeclineInsurance = useCallback(() => {
    debugLog("insurance", "=== PLAYER DECLINES INSURANCE ===");
    setPlayerInsuranceBet(0);
    setInsuranceOffered(false);
  }, [setPlayerInsuranceBet, setInsuranceOffered]);

  // Count Peek handlers
  useEffect(() => {
    if (showCountPeek) {
      if (scoreMultiplier > 1.0) {
        // Show confirmation dialog
        setShowCountPeekConfirmation(true);
      } else {
        // Directly show count reveal
        setShowCountPeekResult(true);
      }
      setShowCountPeek(false);
    }
  }, [showCountPeek, scoreMultiplier]);

  const handleCountPeekConfirm = useCallback(() => {
    // Reset multiplier to 1.0x
    const oldMultiplier = scoreMultiplier;
    setScoreMultiplier(1.0);

    // Show penalty flash
    setShowPenaltyFlash(true);
    setTimeout(() => setShowPenaltyFlash(false), 1000); // Flash for 1 second

    // Show result modal
    setShowCountPeekConfirmation(false);
    setShowCountPeekResult(true);

    debugLog(
      "gamePhases",
      `Score multiplier reset from ${oldMultiplier}x to 1.0x due to count peek`,
    );
  }, [scoreMultiplier, setScoreMultiplier]);

  const handleCountPeekCancel = useCallback(() => {
    setShowCountPeekConfirmation(false);
  }, []);

  const handleShowStrategyCard = useCallback(
    (show: boolean) => {
      const strategyCost = 10;

      // If closing the modal, just close it
      if (!show) {
        setShowStrategyCard(false);
        return;
      }

      // Check cooldown - only allow once per hand
      if (strategyCardUsedThisHand) {
        debugLog(
          "gamePhases",
          "Cannot open strategy card - already used this hand (cooldown active)",
        );
        return;
      }

      // If opening, check if player has enough chips
      if (playerChips < strategyCost) {
        debugLog(
          "gamePhases",
          "Cannot open strategy card - insufficient chips",
        );
        return;
      }

      // Deduct chip cost, mark as used, and open modal
      setPlayerChips(playerChips - strategyCost);
      setStrategyCardUsedThisHand(true);
      setShowStrategyCard(true);

      debugLog(
        "gamePhases",
        `Strategy card opened - ${strategyCost} chips deducted. Remaining chips: ${playerChips - strategyCost}. Cooldown active for this hand.`,
      );
    },
    [playerChips, setPlayerChips, strategyCardUsedThisHand],
  );

  // Suspicion decay hook
  useSuspicionDecay(suspicionLevel, setSuspicionLevel);

  // Dealer suspicion hook - manages dealer-level detection and pit boss reporting
  useDealerSuspicion({
    currentDealer,
    dealerSuspicion,
    suspicionLevel,
    playerSeat,
    initialized,
    setDealerSuspicion,
    setSuspicionLevel,
    setPitBossDistance,
    addSpeechBubble,
  });

  // Wonging detection hook - detects betting high count / sitting out low count
  useWongingDetection({
    handNumber,
    playerSeat,
    playerBet: currentBet,
    trueCount,
    currentDealer,
    initialized,
    phase,
    setDealerSuspicion,
  });

  // Dealer change hook
  useDealerChange(
    shoesDealt,
    dealerChangeInterval,
    currentDealer,
    setCurrentDealer,
  );

  // Game initialization hook
  useGameInitialization(
    setAIPlayers,
    setCurrentDealer,
    setCurrentPitBoss,
    setInitialized,
    devTestingMode,
    isMobileMode,
  );

  // Conversation triggers hook
  useConversationTriggers({
    initialized,
    playerSeat,
    activeConversation,
    aiPlayers,
    currentDealer,
    playerSociability,
    phase,
    suspicionLevel,
    speechBubbles,
    triggerConversation,
    addSpeechBubble,
    registerTimeout,
  });

  // Pit boss movement hook
  usePitBossMovement(setPitBossDistance, suspicionLevel);

  // Pit boss warnings hook - triggers warnings at high suspicion and backoff at 100%
  usePitBossWarnings({
    suspicionLevel,
    playerSeat,
    initialized,
    onWarning: useCallback(
      (message: string) => {
        // Show pit boss warning as a speech bubble at position -2 (pit boss)
        addSpeechBubble(`pitboss-warning-${Date.now()}`, message, -2);
      },
      [addSpeechBubble],
    ),
    onBackoff: useCallback(() => {
      // Show backoff modal
      setShowBackoffModal(true);
    }, []),
  });

  // Dealer voice callouts hook - plays dealer audio when entering phases
  useDealerCallouts({
    phase,
    currentDealer,
    playerSeat,
    addSpeechBubble,
  });

  // Heat map tracking hook - tracks pit boss proximity vs count for discretion analysis
  const { getHeatMapBuckets, getDiscretionScore, dataPointCount } = useHeatMap({
    trueCount:
      calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt) > 0
        ? calculateTrueCount(
            runningCount,
            calculateDecksRemaining(
              gameSettings.numberOfDecks * 52,
              cardsDealt,
            ),
          )
        : 0,
    pitBossDistance,
    currentBet,
    suspicionLevel,
    phase,
    initialized,
  });

  // Auto-start hand hook
  useAutoStartHand({
    initialized,
    aiPlayersLength: aiPlayers.length,
    handNumber,
    phase,
    playerSeat,
    currentBet,
    devTestingMode,
    showTestScenarioSelector,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setSpeechBubbles,
    setAIPlayers,
    aiPlayers,
    dealInitialCards,
    addSpeechBubble,
    registerTimeout,
  });

  // Log betting interface visibility conditions
  useEffect(() => {
    const shouldShowBetting =
      phase === "BETTING" && initialized && playerSeat !== null;
    debugLog("betting", `=== BETTING INTERFACE CHECK ===`);
    debugLog("betting", `Phase: ${phase}`);
    debugLog("betting", `Initialized: ${initialized}`);
    debugLog("betting", `Player seat: ${playerSeat}`);
    debugLog("betting", `Should show betting interface: ${shouldShowBetting}`);
  }, [phase, initialized, playerSeat]);

  // Load devTestingMode from localStorage - ADMIN ONLY
  useEffect(() => {
    if (typeof window !== "undefined" && isAdmin) {
      const saved = localStorage.getItem("devTestingMode");
      if (saved !== null) {
        setDevTestingMode(saved === "true");
      }
    }
  }, [isAdmin]);

  // Save devTestingMode to localStorage - ADMIN ONLY
  useEffect(() => {
    if (typeof window !== "undefined" && isAdmin) {
      localStorage.setItem("devTestingMode", String(devTestingMode));
    }
  }, [devTestingMode, isAdmin]);

  // Show test scenario selector when entering BETTING phase in dev mode
  // Only trigger when phase changes TO betting, not while staying in betting
  useEffect(() => {
    if (phase === "BETTING" && devTestingMode) {
      setShowTestScenarioSelector(true);
    }
  }, [phase, devTestingMode]); // Removed showTestScenarioSelector from dependencies

  // Clear all timeouts and reset game state when dev mode changes
  useEffect(() => {
    // Skip on initial mount - only run when devTestingMode actually changes
    if (!initialized) return;

    debugLog(
      "testScenario",
      `Dev mode changed to ${devTestingMode ? "ON" : "OFF"} - clearing animations and resetting game`,
    );

    // Clear all pending timeouts (stops any in-flight card animations)
    clearAllTimeouts();

    // Clear flying cards
    setFlyingCards([]);

    // Reset to BETTING phase
    setPhase("BETTING");

    // Clear hands
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
    setDealerRevealed(false);
    setPlayerFinished(false);
    setSpeechBubbles([]);
    clearAllConversationColors();
    setWinLossBubbles([]);

    // Note: aiPlayers will be reset by useGameInitialization hook which also runs on devTestingMode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devTestingMode]);

  // AI turns phase hook (handles its own reset logic internally)
  useAITurnsPhase({
    phase,
    aiPlayers,
    dealerHand,
    activePlayerIndex,
    playersFinished,
    blackjackCelebratedPlayers,
    playerSeat,
    playerHand,
    playerFinished,
    gameSettings,
    setActivePlayerIndex,
    setPlayersFinished,
    setPlayerActions,
    setAIPlayers,
    setFlyingCards,
    setPhase,
    dealCardFromShoe,
    registerTimeout,
    getCardPositionForAnimation: (
      type: "shoe" | "ai",
      aiIndex?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, aiIndex, cardIndex),
    addSpeechBubble,
  });

  // Dealing phase hook - marks blackjack hands as finished and shows celebration
  useDealingPhase({
    phase,
    aiPlayers,
    dealerHand,
    setPlayersFinished,
    setPlayerActions,
    registerTimeout,
    addSpeechBubble,
    setBlackjackCelebratedPlayers,
  });

  // Insurance phase hook - handles insurance decisions
  useInsurancePhase({
    phase,
    gameSettings,
    insuranceOffered,
    setInsuranceOffered,
    aiPlayers,
    setAIPlayers,
    playerSeat,
    playerInsuranceBet,
    setPhase,
    registerTimeout,
  });

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
    clearAllConversationColors(); // Release all conversation colors
    clearDebugLogs(); // Clear debug logs at start of new hand
    setStrategyCardUsedThisHand(false); // Reset strategy card cooldown for new hand

    // Clear cards from previous hand
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
    setDealerRevealed(false);
    setPlayerFinished(false);
    setBlackjackCelebratedPlayers(new Set()); // Reset blackjack celebrations

    // Clear AI player cards
    setAIPlayers((prev) =>
      prev.map((ai) => ({
        ...ai,
        hand: { cards: [], bet: 0 },
      })),
    );
  }, [
    clearDebugLogs,
    setPlayerHand,
    setDealerHand,
    setCurrentBet,
    setDealerRevealed,
    setPlayerFinished,
    setAIPlayers,
  ]);

  // Round end phase hook
  useRoundEndPhase({
    phase,
    aiPlayers,
    playerSeat,
    cardsDealt,
    gameSettings,
    isSubscribed,
    showSubscribeBanner,
    activeConversation,
    speechBubbles,
    registerTimeout,
    setAIPlayers,
    setDealerCallout,
    addSpeechBubble,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    setShowSubscribeBanner,
    nextHand,
  });

  // Dealer turn phase hook
  useDealerTurnPhase({
    phase,
    dealerHand,
    aiPlayers,
    gameSettings,
    currentDealer,
    setDealerRevealed,
    setRunningCount,
    setDealerHand,
    setFlyingCards,
    setPhase,
    dealCardFromShoe,
    registerTimeout,
    getCardPositionForAnimation: (
      type: "shoe" | "dealer",
      aiIndex?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, aiIndex, cardIndex),
    addSpeechBubble,
  });

  // Resolving phase hook
  useResolvingPhase({
    phase,
    playerHand,
    dealerHand,
    gameSettings,
    aiPlayers,
    playerSeat,
    currentDealer,
    previousBet,
    cardsDealt,
    runningCount,
    playerInsuranceBet,
    setPlayerInsuranceBet,
    setAIPlayers,
    setPlayerChips,
    setPlayerHand,
    setPitBossDistance,
    setSuspicionLevel,
    setDealerSuspicion,
    setPreviousBet,
    setDealerCallout,
    setWinLossBubbles,
    setPhase,
    registerTimeout,
    showEndOfHandReactions,
    addSpeechBubble,
    recordHand,
  });

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    setMusicStarted(true);
  };

  // Handle new session after backoff - reset game state
  const handleNewSession = useCallback(() => {
    setShowBackoffModal(false);
    // Reset suspicion
    setSuspicionLevel(0);
    setDealerSuspicion(0);
    setPitBossDistance(30);
    // Reset phase to betting
    setPhase("BETTING");
    // Clear hands
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
    setDealerRevealed(false);
    setPlayerFinished(false);
    setSpeechBubbles([]);
    clearAllConversationColors();
    setWinLossBubbles([]);
    // Change dealer (new table)
    setCurrentDealer(null);
    // Increment hand number to trigger re-initialization
    setHandNumber((prev) => prev + 1);
  }, [
    setPhase,
    setPlayerHand,
    setDealerHand,
    setCurrentBet,
    setDealerRevealed,
    setPlayerFinished,
    setSpeechBubbles,
    setCurrentDealer,
    setSuspicionLevel,
    setDealerSuspicion,
    setPitBossDistance,
    setWinLossBubbles,
  ]);

  // Wrap setPlayerSeat to require authentication and kick out any AI from the seat
  const handleSeatClick = (seat: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Kick out any AI player from this seat
    setAIPlayers((prev) => prev.filter((ai) => ai.position !== seat));
    setPlayerSeat(seat);
  };

  return (
    <>
      <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={refreshAuth}
        initialMode="login"
      />
      <AdminSettingsModal
        isOpen={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
        devTestingMode={devTestingMode}
        setDevTestingMode={setDevTestingMode}
        onResetComplete={() => {
          // Reset local state to match DB reset values
          setPlayerChips(1000);
          setPeakChips(1000);
          setCurrentScore(0);
          setCurrentStreak(0);
          setLongestStreak(0);
          setEarnedBadgeIds([]);
        }}
      />
      <BackoffModal
        isOpen={showBackoffModal}
        playerChips={playerChips}
        sessionNetProfit={getSessionNetProfit()}
        onNewSession={handleNewSession}
      />
      <SubscribeBannerModal
        isOpen={showSubscribeBanner}
        onClose={() => setShowSubscribeBanner(false)}
      />
      <ChatPanel isOpen={showChat} onClose={() => setShowChat(false)} />
      <CountPeekConfirmation
        isOpen={showCountPeekConfirmation}
        currentMultiplier={scoreMultiplier}
        onConfirm={handleCountPeekConfirm}
        onCancel={handleCountPeekCancel}
      />
      <CountPeekModal
        isOpen={showCountPeekResult}
        runningCount={runningCount}
        trueCount={calculateTrueCount(
          runningCount,
          calculateDecksRemaining(shoe.length, cardsDealt),
        )}
        decksRemaining={calculateDecksRemaining(shoe.length, cardsDealt)}
        onClose={() => setShowCountPeekResult(false)}
      />
      <TestScenarioSelector
        isOpen={showTestScenarioSelector}
        onClose={() => setShowTestScenarioSelector(false)}
        onSelectScenario={(scenario) => {
          setSelectedTestScenario(scenario);
          setShowTestScenarioSelector(false);
        }}
      />
      {/* Penalty Flash Effect */}
      {showPenaltyFlash && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(239, 68, 68, 0.4)",
            zIndex: 2000,
            pointerEvents: "none",
            animation: "penaltyPulse 1s ease-in-out",
          }}
        />
      )}
      <GameStateProvider
        value={{
          suspicionLevel,
          dealerSuspicion,
          pitBossDistance,
          gameSettings,
          runningCount,
          currentStreak,
          playerChips,
          chipsLoading,
          currentScore,
          scoreMultiplier,
          cardsDealt,
          currentDealer,
          currentPitBoss,
          dealerCallout,
          phase,
          dealerHand,
          dealerRevealed,
          aiPlayers,
          playerSeat,
          playerHand,
          playerFinished,
          currentBet,
          activePlayerIndex,
          playerActions,
          speechBubbles,
          winLossBubbles,
          activeConversation,
          flyingCards,
          showDealerInfo,
          insuranceOffered,
          minBet,
          maxBet,
          peakChips,
          longestStreak,
          sessionStats,
          sessionNetProfit: getSessionNetProfit(),
          sessionWinRate: getSessionWinRate(),
          earnedBadgeIds,
        }}
      >
        <UIStateProvider
          value={{
            initialized,
            showSettings,
            showLeaderboard,
            showStrategyCard,
            showHeatMap,
            showCountPeek,
            showSessionStats,
            showAdvancedAnalytics,
            showSubscribeBanner,
            showChat,
            debugLogs,
            showDebugLog,
            strategyCardUsedThisHand,
            devTestingMode,
            selectedTestScenario,
            heatMapBuckets: getHeatMapBuckets(),
            discretionScore: getDiscretionScore(),
            heatMapDataPointCount: dataPointCount,
            setShowSettings,
            setShowAdminSettings,
            setShowLeaderboard,
            setShowStrategyCard: handleShowStrategyCard,
            setShowHeatMap,
            setShowDealerInfo,
            setShowCountPeek,
            setShowSessionStats,
            setShowAdvancedAnalytics,
            setShowSubscribeBanner,
            setShowChat,
            setShowDebugLog,
            setDevTestingMode,
            clearDebugLogs,
          }}
        >
          <GameActionsProvider
            value={{
              setPlayerSeat: handleSeatClick,
              startNewRound,
              hit,
              stand,
              doubleDown,
              split,
              surrender,
              handleBetChange,
              handleConfirmBet,
              handleClearBet,
              handleTakeInsurance,
              handleDeclineInsurance,
              handleConversationResponse,
              handleConversationIgnore,
              setGameSettings,
              setWinLossBubbles,
              registerTimeout,
            }}
          >
            <BlackjackGameUI />
          </GameActionsProvider>
        </UIStateProvider>
      </GameStateProvider>

      {/* Badge bar at bottom of screen - only for authenticated users */}
      <BadgeBar
        earnedBadgeIds={earnedBadgeIds}
        isAuthenticated={isAuthenticated}
      />

      {/* Badge earned animation */}
      {animatingBadgeId && (
        <BadgeEarnedAnimation
          badgeId={animatingBadgeId}
          onComplete={() => setAnimatingBadgeId(null)}
        />
      )}

      {/* Invite and Share overlay - top left */}
      {isAuthenticated && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            left: "20px",
            zIndex: 1000,
          }}
        >
          <InviteFriend />
        </div>
      )}

      <BackgroundMusic shouldPlay={musicStarted} />
    </>
  );
}
