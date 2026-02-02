import React from "react";
import WinLossBubble from "@/components/WinLossBubble";
import SpeechBubble from "@/components/SpeechBubble";
import ConversationPrompt from "@/components/ConversationPrompt";
import FlyingCard from "@/components/FlyingCard";
import { useGameState } from "@/contexts/GameStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function GameOverlays() {
  const { speechBubbles, winLossBubbles, activeConversation, flyingCards } =
    useGameState();
  const {
    handleConversationResponse,
    handleConversationIgnore,
    setWinLossBubbles,
    registerTimeout,
  } = useGameActions();
  return (
    <>
      {/* Speech Bubbles - only render visible ones */}
      {speechBubbles
        .filter((bubble) => bubble.visible)
        .map((bubble) => (
          <SpeechBubble
            key={bubble.playerId}
            position={bubble.position}
            message={bubble.message}
            playerId={bubble.playerId}
            isDealer={bubble.isDealer}
            playerPosition={bubble.playerPosition}
            conversationId={bubble.conversationId}
          />
        ))}

      {/* Win/Loss Result Bubbles */}
      {winLossBubbles.map((bubble) => (
        <WinLossBubble
          key={bubble.id}
          position={bubble.position}
          result={bubble.result}
          amount={bubble.amount}
          onComplete={() => {
            setWinLossBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
          }}
        />
      ))}

      {/* Active Conversation Prompt */}
      {activeConversation && (
        <ConversationPrompt
          speakerName={activeConversation.speakerName}
          question={activeConversation.question}
          choices={activeConversation.choices}
          position={activeConversation.position}
          onResponse={handleConversationResponse}
          onIgnore={handleConversationIgnore}
          registerTimeout={registerTimeout}
        />
      )}

      {/* Flying Cards Animations */}
      {flyingCards.map((flyingCard) => (
        <FlyingCard
          key={flyingCard.id}
          fromPosition={flyingCard.fromPosition}
          toPosition={flyingCard.toPosition}
          onAnimationComplete={() => {
            // Card removal is handled in the dealInitialCards timeout
          }}
        />
      ))}
    </>
  );
}
