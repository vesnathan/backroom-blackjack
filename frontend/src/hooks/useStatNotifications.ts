import { useState, useRef, useEffect, useCallback } from "react";

export interface StatNotification {
  id: string;
  icon: string;
  label: string;
  value: string;
  color?: string;
}

const NOTIFICATION_DURATION = 2500; // Total time notification is visible (ms)

/**
 * Hook to track stat changes and generate notifications
 * Notifications appear when Streak, Score, or Multiplier change
 */
export function useStatNotifications(
  currentStreak: number,
  currentScore: number,
  scoreMultiplier: number,
): {
  notifications: StatNotification[];
  dismissNotification: (id: string) => void;
} {
  const [notifications, setNotifications] = useState<StatNotification[]>([]);

  // Track previous values
  const prevStreak = useRef<number | null>(null);
  const prevScore = useRef<number | null>(null);
  const prevMultiplier = useRef<number | null>(null);

  // Track if this is the initial mount (don't show notifications on first load)
  const isInitialized = useRef(false);

  const addNotification = useCallback((notif: Omit<StatNotification, "id">) => {
    const id = `${notif.label}-${Date.now()}`;
    setNotifications((prev) => [...prev, { ...notif, id }]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, NOTIFICATION_DURATION);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Detect streak changes
  useEffect(() => {
    if (!isInitialized.current) return;
    if (prevStreak.current !== null && currentStreak !== prevStreak.current) {
      addNotification({
        icon: "🔥",
        label: "Streak",
        value: String(currentStreak),
        color: "#FFF",
      });
    }
    prevStreak.current = currentStreak;
  }, [currentStreak, addNotification]);

  // Detect score changes
  useEffect(() => {
    if (!isInitialized.current) return;
    if (prevScore.current !== null && currentScore !== prevScore.current) {
      const diff = currentScore - prevScore.current;
      const sign = diff > 0 ? "+" : "";
      addNotification({
        icon: "⭐",
        label: "Score",
        value: `${sign}${diff.toLocaleString()}`,
        color: diff > 0 ? "#4CAF50" : "#F44336",
      });
    }
    prevScore.current = currentScore;
  }, [currentScore, addNotification]);

  // Detect multiplier changes
  useEffect(() => {
    if (!isInitialized.current) return;
    if (
      prevMultiplier.current !== null &&
      scoreMultiplier !== prevMultiplier.current
    ) {
      addNotification({
        icon: "✨",
        label: "Multiplier",
        value: `${scoreMultiplier.toFixed(1)}x`,
        color: "#4CAF50",
      });
    }
    prevMultiplier.current = scoreMultiplier;
  }, [scoreMultiplier, addNotification]);

  // Mark as initialized after first render
  useEffect(() => {
    // Store initial values without triggering notifications
    prevStreak.current = currentStreak;
    prevScore.current = currentScore;
    prevMultiplier.current = scoreMultiplier;
    isInitialized.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { notifications, dismissNotification };
}
