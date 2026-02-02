import React, { useState, useEffect } from "react";
import { calculateCutCardPosition } from "@/types/gameSettings";
import Shoe from "@/components/Shoe";
import DealerSection from "@/components/DealerSection";
import TableSeats from "@/components/TableSeats";
import GameOverlays from "@/components/GameOverlays";
import DealerInfo from "@/components/DealerInfo";
import TableRules from "@/components/TableRules";
import PitBossAvatar from "@/components/PitBossAvatar";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

// Calculate scale factor and mobile mode based on screen size
function useTableLayout(): { scale: number; isMobileMode: boolean } {
  const [layout, setLayout] = useState({ scale: 1, isMobileMode: false });

  useEffect(() => {
    const calculateLayout = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      // Mobile mode: small screens (phones in landscape)
      const isMobileMode = height < 500 || width < 900;

      // Reference dimensions
      const referenceHeight = 900;
      const referenceWidth = 1600;

      // Calculate scale based on actual dimensions
      let newScale = Math.min(1, height / referenceHeight);
      const widthScale = Math.min(1, width / referenceWidth);
      newScale = Math.min(newScale, widthScale);

      // Mobile mode: with only 5 seats, we can scale up more (bigger cards!)
      // Minimum scale of 0.55 for mobile, 0.4 for desktop
      const minScale = isMobileMode ? 0.55 : 0.4;
      newScale = Math.max(minScale, newScale);

      setLayout({ scale: newScale, isMobileMode });
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    window.addEventListener("orientationchange", calculateLayout);

    return () => {
      window.removeEventListener("resize", calculateLayout);
      window.removeEventListener("orientationchange", calculateLayout);
    };
  }, []);

  return layout;
}

export default function GameTable() {
  const {
    gameSettings,
    cardsDealt,
    currentDealer,
    currentPitBoss,
    showDealerInfo,
  } = useGameState();
  const { setShowDealerInfo } = useUIState();
  const { registerTimeout } = useGameActions();
  const { scale: tableScale, isMobileMode } = useTableLayout();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgb(107, 0, 0)",
        overflow: "hidden",
      }}
    >
      {/* Table Background Pattern */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          opacity: 0.5,
          backgroundImage: "url(/tableBG.webp)",
          backgroundRepeat: "repeat",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content Container - scales for mobile */}
      <div
        style={{
          position: "absolute",
          width: `${100 / tableScale}%`,
          height: `${100 / tableScale}%`,
          top: 0,
          left: 0,
          zIndex: 1,
          transform: `scale(${tableScale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Shoe Component */}
        <Shoe
          numDecks={gameSettings.numberOfDecks}
          cardsDealt={cardsDealt}
          dealerCutCard={calculateCutCardPosition(
            gameSettings.numberOfDecks,
            gameSettings.deckPenetration,
          )}
        />

        {/* Dealer Section - Top Center with Avatar */}
        <DealerSection />

        {/* Pit Boss Avatar - Left of Dealer */}
        <PitBossAvatar pitBoss={currentPitBoss} />

        {/* Player Spots - 5 seats on mobile, 8 on desktop */}
        <TableSeats isMobileMode={isMobileMode} />

        {/* Table Rules Placard */}
        <TableRules gameSettings={gameSettings} />

        {/* Game Overlays: Action Buttons, Bubbles, Conversations, Flying Cards */}
        <GameOverlays />
      </div>

      {/* Dealer Info Modal */}
      {showDealerInfo && currentDealer && (
        <DealerInfo
          dealer={currentDealer}
          onClose={() => setShowDealerInfo(false)}
          openAsModal
          registerTimeout={registerTimeout}
        />
      )}

      {/* CSS Animations */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
