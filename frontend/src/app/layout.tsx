"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { GlobalMessage } from "@/components/common/GlobalMessage";
import { RotateDeviceOverlay } from "@/components/RotateDeviceOverlay";
import { ScreenSizeGate } from "@/components/ScreenSizeGate";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AMPLIFY_CONFIG } from "../config/amplifyConfig";
import "./globals.css";

Amplify.configure(AMPLIFY_CONFIG);

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handleLogout = useLogoutFn();

  // Handle session timeout globally
  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000, // 24 hours
    handleLogout,
  });

  // Define protected pages that require authentication
  const isProtectedPage =
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/game");

  const isUnprotectedPage = !isProtectedPage;

  return (
    <html lang="en" className="dark">
      <head>
        <title>Backroom Blackjack</title>
        <meta
          name="description"
          content="Master card counting with AI opponents in this immersive blackjack trainer. Practice Hi-Lo, KO, Hi-Opt I, Hi-Opt II, and Omega II systems."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.webp" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://backroom-blackjack.com/" />
        <meta
          property="og:title"
          content="Backroom Blackjack - Card Counting Trainer"
        />
        <meta
          property="og:description"
          content="Can you count cards without getting caught? Master Hi-Lo, KO, Hi-Opt I, Hi-Opt II, and Omega II systems."
        />
        <meta
          property="og:image"
          content="https://backroom-blackjack.com/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://backroom-blackjack.com/" />
        <meta
          name="twitter:title"
          content="Backroom Blackjack - Card Counting Trainer"
        />
        <meta
          name="twitter:description"
          content="Can you count cards without getting caught? Master Hi-Lo, KO, Hi-Opt I, Hi-Opt II, and Omega II systems."
        />
        <meta
          name="twitter:image"
          content="https://backroom-blackjack.com/og-image.png"
        />
      </head>
      <body className="felt-background">
        <ScreenSizeGate>
          <RotateDeviceOverlay />
          <QueryProvider>
            <NextUIProvider>
              <AuthProvider>
                <GlobalMessage />
                {isUnprotectedPage ? (
                  <main>{children}</main>
                ) : (
                  <RequireAuth>
                    <main>{children}</main>
                  </RequireAuth>
                )}
              </AuthProvider>
            </NextUIProvider>
          </QueryProvider>
        </ScreenSizeGate>
      </body>
    </html>
  );
}
