"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { getLayoutConfig } from "@/constants/cardLayout";

type ShoeProps = {
  numDecks: number;
  cardsDealt: number;
  dealerCutCard: number;
};

const Shoe = ({
  numDecks,
  cardsDealt,
  dealerCutCard,
}: ShoeProps): JSX.Element => {
  const isMobile = useIsMobile();
  const { cardWidth, cardHeight } = getLayoutConfig(isMobile);

  // Shoe dimensions based on card size (shoe is roughly 1.4x card width, 1.5x card height)
  const shoeWidth = Math.round(cardWidth * 1.43);
  const shoeHeight = Math.round(cardHeight * 1.53);
  // Card back dimensions (slightly smaller than actual cards)
  const cardBackWidth = Math.round(cardWidth * 0.71);
  const cardBackHeight = Math.round(cardHeight * 0.9);

  return (
    <div
      style={{
        position: "absolute",
        width: `${shoeWidth}px`,
        height: `${shoeHeight}px`,
        right: isMobile ? "calc(5% + 80px)" : "calc(7% + 200px)",
        top: isMobile ? "10px" : "20px",
        // eslint-disable-next-line sonarjs/no-duplicate-string
        transform: "rotate(90deg)",
        zIndex: 10001,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgb(0, 0, 0)",
          position: "absolute",
        }}
      >
        {/* Shoe cover */}
        <div
          style={{
            width: "100%",
            height: "20%",
            backgroundColor: "rgba(0, 0, 0, .5)",
            position: "absolute",
            bottom: "-30px",
            zIndex: 1000,
          }}
        />

        {/* Decks holder */}
        <div
          style={{
            width: "100%",
            height: "80%",
            position: "absolute",
            bottom: "0%",
          }}
        >
          {/* Cut card indicator */}
          <div
            style={{
              height: "1px",
              position: "absolute",
              width: "87%",
              left: "6.5%",
              bottom: `${(numDecks * 52 - cardsDealt - dealerCutCard) / 4.16}%`,
              border: "1px solid rgb(0, 0, 0)",
              zIndex: 10000,
            }}
          />
          {/* Remaining cards - striped background matching card height */}
          <div
            style={{
              width: "87%",
              backgroundImage: "url(/assets/images/cardSide.png)",
              backgroundSize: "cover",
              backgroundRepeat: "repeat-y",
              position: "absolute",
              bottom: "0%",
              left: "6.5%",
              height: `${(numDecks * 52 - cardsDealt) / 4.16}%`,
            }}
          />
        </div>

        {/* Card backs showing at the opening - maintaining proper card aspect ratio */}
        <div
          style={{
            width: `${cardBackWidth}px`,
            height: `${cardBackHeight}px`,
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "92%",
            left: "24%",
            zIndex: 999,
          }}
        />
        <div
          style={{
            width: "52%",
            height: `${cardBackHeight}px`,
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "82%",
            left: "24%",
            zIndex: 998,
          }}
        />
      </div>
    </div>
  );
};

export default Shoe;
