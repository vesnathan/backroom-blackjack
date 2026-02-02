import React, { useState } from "react";
import StatsBar from "@/components/StatsBar";
import GameTable from "@/components/GameTable";
import GameModals from "@/components/GameModals";
import HeatMapModal from "@/components/HeatMapModal";
import { useGameState } from "@/contexts/GameStateContext";

export default function BlackjackGameUI() {
  const { phase, runningCount } = useGameState();
  const [devMenuHovered, setDevMenuHovered] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Stats Bar at Top */}
      <StatsBar />

      {/* Dev Info Menu (Dev Mode Only) - Bottom Left, hover to expand */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            bottom: "120px",
            left: "20px",
            zIndex: 1001,
          }}
          onMouseEnter={() => setDevMenuHovered(true)}
          onMouseLeave={() => setDevMenuHovered(false)}
        >
          {devMenuHovered ? (
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "2px solid #00FF00",
                borderRadius: "8px",
                padding: "12px 16px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              <div style={{ color: "#00FF00", fontWeight: "bold" }}>
                PHASE: {phase}
              </div>
              <div
                style={{
                  color: "#FFD700",
                  fontWeight: "bold",
                  marginTop: "6px",
                }}
              >
                COUNT: {runningCount >= 0 ? `+${runningCount}` : runningCount}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "1px solid #00FF00",
                borderRadius: "4px",
                padding: "4px 8px",
                color: "#00FF00",
                fontSize: "10px",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              DEV
            </div>
          )}
        </div>
      )}

      {/* Full Viewport Game Table */}
      <GameTable />

      {/* All Game Modals */}
      <GameModals />

      {/* Heat Map Modal */}
      <HeatMapModal />
    </div>
  );
}
