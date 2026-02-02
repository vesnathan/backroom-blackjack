import { useEffect } from "react";

/**
 * Hook to handle pit boss movement around the casino floor
 * Movement is influenced by suspicion level:
 * - High suspicion (70+): pit boss actively approaches (targets 60-80 range)
 * - Medium suspicion (40-70): pit boss investigates (targets 40-60 range)
 * - Low suspicion (0-40): pit boss patrols at distance (targets 20-40 range)
 */
export function usePitBossMovement(
  setPitBossDistance: (distance: number | ((prev: number) => number)) => void,
  suspicionLevel: number,
) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      setPitBossDistance((prev) => {
        // Random walk: small changes up or down
        const change = (Math.random() - 0.5) * 20; // -10 to +10
        let newDistance = prev + change;

        // Keep within bounds (0-100 range, allowing "gone" state at 75+)
        newDistance = Math.max(0, Math.min(100, newDistance));

        // Suspicion influences pit boss behavior
        if (suspicionLevel >= 70) {
          // High suspicion: pit boss approaches and stays close (distance 0-30)
          if (newDistance > 30) {
            newDistance -= Math.random() * 15; // Pull closer
          }
        } else if (suspicionLevel >= 40) {
          // Medium suspicion: pit boss investigates (distance 30-60)
          if (newDistance < 30) {
            newDistance += Math.random() * 10; // Push away a bit
          } else if (newDistance > 60) {
            newDistance -= Math.random() * 10; // Pull back
          }
        } else {
          // Low suspicion: pit boss wanders, often far away or gone (distance 50-100)
          if (newDistance < 50) {
            newDistance += Math.random() * 15; // Push away - should be distant
          }
          // 20% chance to wander even further toward "gone"
          if (Math.random() < 0.2) {
            newDistance += Math.random() * 20;
          }
        }

        return Math.round(newDistance);
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(wanderInterval);
  }, [suspicionLevel, setPitBossDistance]);
}
