"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import Image from "next/image";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hook to check if we're on a small screen
function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsSmall(window.innerHeight < 600 || window.innerWidth < 600);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isSmall;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const isSmallScreen = useIsSmallScreen();

  const handleStartGame = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isSmallScreen ? "sm" : "lg"}
      isDismissable={false}
      hideCloseButton
      backdrop="blur"
      classNames={{
        base: isSmallScreen ? "max-h-[95vh] my-2" : "",
        body: isSmallScreen ? "py-2" : "",
        header: isSmallScreen ? "py-2" : "",
        footer: isSmallScreen ? "py-2" : "",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center gap-2 text-white pt-4">
          <Image
            src="/logo.webp"
            alt="Backroom Blackjack"
            width={isSmallScreen ? 80 : 160}
            height={isSmallScreen ? 80 : 160}
            className={isSmallScreen ? "mb-1" : "mb-2"}
            priority
          />
          <h2
            className={`font-bold chip-gold text-center ${isSmallScreen ? "text-lg" : "text-3xl"}`}
          >
            Welcome to Backroom Blackjack!
          </h2>
        </ModalHeader>
        <ModalBody className="text-center">
          <div className={isSmallScreen ? "space-y-2" : "space-y-4"}>
            <p
              className={`text-white leading-relaxed ${isSmallScreen ? "text-sm" : "text-lg"}`}
            >
              Master card counting in a realistic casino environment. Beat the
              house!
            </p>

            <p
              className={`text-white font-bold chip-gold ${isSmallScreen ? "text-lg mt-2" : "text-2xl mt-6"}`}
            >
              Have Fun!
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-center">
          <Button
            className={`w-full max-w-md bg-casino-gold hover:bg-yellow-600 text-black font-bold ${isSmallScreen ? "text-sm py-3" : "text-lg py-6"}`}
            onPress={handleStartGame}
            size={isSmallScreen ? "md" : "lg"}
            style={{ minHeight: "44px" }}
          >
            Start Playing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
