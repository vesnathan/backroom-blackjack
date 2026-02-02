import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import ChipStoreModal from "@/components/ChipStoreModal";
import { signOut } from "aws-amplify/auth";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStatNotifications } from "@/hooks/useStatNotifications";
import { StatsNotification } from "@/components/StatsNotification";
import { useIsMobile } from "@/hooks/useMediaQuery";

const BORDER_GOLD = "2px solid #FFD700";
const BG_GOLD_MENU_HOVER = "rgba(255, 215, 0, 0.2)";
const MENU_ITEM_BORDER = "1px solid #444";
const TRANSITION_BG = "background-color 0.2s";
const SUBMENU_PADDING = "12px 16px 12px 32px";
const JUSTIFY_SPACE_BETWEEN = "space-between";

export default function StatsBar() {
  const {
    currentStreak,
    playerChips,
    chipsLoading,
    currentScore,
    scoreMultiplier,
  } = useGameState();

  const {
    setShowSettings,
    setShowAdminSettings,
    setShowLeaderboard,
    setShowStrategyCard,
    setShowHeatMap,
    setShowCountPeek,
    setShowSessionStats,
    setShowAdvancedAnalytics,
    setShowChat,
    strategyCardUsedThisHand,
  } = useUIState();
  const { hasFeature } = useSubscription();
  const { notifications, dismissNotification } = useStatNotifications(
    currentStreak,
    currentScore,
    scoreMultiplier,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChipStore, setShowChipStore] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isAuthenticated, isLoading, isAdmin, user, refresh } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Click-away to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
        setShowMobileMenu(false);
      }
    };

    if (showMoreMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu, showMobileMenu]);

  // Close mobile menu on navigation
  const handleMobileNavigation = (action: () => void) => {
    action();
    setShowMobileMenu(false);
  };

  const handleLogout = async () => {
    await signOut();
    await refresh();
  };

  // Mobile menu button styles
  const mobileMenuButtonStyle: React.CSSProperties = {
    position: "fixed",
    top: "10px",
    right: "10px",
    width: "44px",
    height: "44px",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    border: BORDER_GOLD,
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1001,
    fontSize: "20px",
  };

  // Mobile slide-in menu styles
  const mobileMenuStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "280px",
    maxWidth: "85vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.98)",
    borderLeft: BORDER_GOLD,
    zIndex: 1000,
    overflowY: "auto",
    transform: showMobileMenu ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease-in-out",
    paddingTop: "60px", // Space for close button
  };

  // Mobile overlay backdrop
  const mobileOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    opacity: showMobileMenu ? 1 : 0,
    pointerEvents: showMobileMenu ? "auto" : "none",
    transition: "opacity 0.3s ease-in-out",
  };

  // Render menu items - shared between mobile and desktop
  const renderMenuItems = (forMobile: boolean) => {
    const padding = forMobile ? "16px 20px" : "12px 16px";
    const submenuPadding = forMobile ? "16px 20px 16px 36px" : SUBMENU_PADDING;
    const fontSize = forMobile ? "16px" : "14px";
    const minHeight = forMobile ? "48px" : "auto";

    return (
      <>
        {/* Chips - auth only */}
        {isAuthenticated && (
          <div
            style={{
              padding,
              color: "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize,
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
              minHeight,
            }}
          >
            <span>💰 Chips</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {chipsLoading ? "..." : `$${playerChips.toLocaleString()}`}
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowChipStore(true))
                    : setShowChipStore(true)
                }
                title="Buy more chips"
                style={{
                  backgroundColor: "transparent",
                  color: "#4CAF50",
                  border: "none",
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "0 4px",
                  minWidth: forMobile ? "44px" : "auto",
                  minHeight: forMobile ? "44px" : "auto",
                }}
              >
                +
              </button>
            </span>
          </div>
        )}

        {/* Score - auth only */}
        {isAuthenticated && (
          <div
            style={{
              padding,
              color: "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize,
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
              minHeight,
            }}
          >
            <span>⭐ Score</span>
            <span>{currentScore.toLocaleString()}</span>
          </div>
        )}

        {/* Multiplier - auth only */}
        {isAuthenticated && (
          <div
            style={{
              padding,
              color: scoreMultiplier > 1.0 ? "#4CAF50" : "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize,
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
              minHeight,
            }}
          >
            <span>✨ Multiplier</span>
            <span>{scoreMultiplier.toFixed(1)}x</span>
          </div>
        )}

        {/* More Menu Expander - only for authenticated on desktop */}
        {isAuthenticated && !forMobile && (
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              display: "block",
              width: "100%",
              padding,
              backgroundColor: "transparent",
              color: "#FFF",
              border: "none",
              borderBottom: showMoreMenu ? MENU_ITEM_BORDER : "none",
              fontSize,
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "left",
              transition: TRANSITION_BG,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {showMoreMenu ? "▼" : "▶"} More
          </button>
        )}

        {/* Expanded Menu Items - always show for non-auth or mobile, expandable for auth desktop */}
        {(showMoreMenu || !isAuthenticated || forMobile) && (
          <>
            {/* Show Count - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowCountPeek(true))
                    : setShowCountPeek(true)
                }
                title={
                  scoreMultiplier > 1.0
                    ? "Peek at count (costs 10 chips, resets multiplier to 1.0x)"
                    : "Peek at count (costs 10 chips)"
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span>👁️ Show Count</span>
                  <span
                    style={{
                      fontSize: forMobile ? "13px" : "11px",
                      color: "#888",
                      fontWeight: "normal",
                      marginTop: "2px",
                    }}
                  >
                    Resets multiplier, costs $10
                  </span>
                </span>
              </button>
            )}

            {/* Strategy - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowStrategyCard(true))
                    : setShowStrategyCard(true)
                }
                disabled={strategyCardUsedThisHand}
                title={
                  strategyCardUsedThisHand
                    ? "Strategy card already used this hand (cooldown active)"
                    : "View basic strategy chart (costs 10 chips)"
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: strategyCardUsedThisHand ? "#666" : "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: strategyCardUsedThisHand ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  opacity: strategyCardUsedThisHand ? 0.5 : 1,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  if (!strategyCardUsedThisHand) {
                    e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span>📊 Strategy</span>
                  <span
                    style={{
                      fontSize: forMobile ? "13px" : "11px",
                      color: strategyCardUsedThisHand ? "#666" : "#888",
                      fontWeight: "normal",
                      marginTop: "2px",
                    }}
                  >
                    {strategyCardUsedThisHand
                      ? "Used this hand"
                      : "Resets multiplier, costs $10"}
                  </span>
                </span>
              </button>
            )}

            {/* Leaderboard */}
            <button
              type="button"
              onClick={() =>
                forMobile
                  ? handleMobileNavigation(() => setShowLeaderboard(true))
                  : setShowLeaderboard(true)
              }
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated
                  ? forMobile
                    ? submenuPadding
                    : SUBMENU_PADDING
                  : padding,
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize,
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "left",
                transition: TRANSITION_BG,
                minHeight,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              🏆 Leaderboard
            </button>

            {/* Global Chat - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowChat(true))
                    : setShowChat(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                💬 Chat
              </button>
            )}

            {/* Profile - only for authenticated */}
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() =>
                        router.push(`/profile?userId=${user.userId}`),
                      )
                    : router.push(`/profile?userId=${user.userId}`)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                👤 My Profile
              </button>
            )}

            {/* Supporters */}
            <button
              type="button"
              onClick={() =>
                forMobile
                  ? handleMobileNavigation(() => router.push("/supporters"))
                  : router.push("/supporters")
              }
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated
                  ? forMobile
                    ? submenuPadding
                    : SUBMENU_PADDING
                  : padding,
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize,
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "left",
                transition: TRANSITION_BG,
                minHeight,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              💎 Supporters
            </button>

            {/* Charts - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowHeatMap(true))
                    : setShowHeatMap(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                📈 Charts
              </button>
            )}

            {/* Stats - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowSessionStats(true))
                    : setShowSessionStats(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                📊 Stats
              </button>
            )}

            {/* Advanced Analytics - Gold+ (auth only) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  if (hasFeature("advancedAnalytics")) {
                    if (forMobile) {
                      handleMobileNavigation(() =>
                        setShowAdvancedAnalytics(true),
                      );
                    } else {
                      setShowAdvancedAnalytics(true);
                    }
                  } else if (forMobile) {
                    handleMobileNavigation(() => router.push("/subscribe"));
                  } else {
                    router.push("/subscribe");
                  }
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: hasFeature("advancedAnalytics") ? "#FFD700" : "#888",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {hasFeature("advancedAnalytics")
                  ? "📈 Analytics"
                  : "🔒 Analytics (Gold+)"}
              </button>
            )}

            {/* Learn Counting - always available */}
            <button
              type="button"
              onClick={() =>
                forMobile
                  ? handleMobileNavigation(() => router.push("/learn"))
                  : router.push("/learn")
              }
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated
                  ? forMobile
                    ? submenuPadding
                    : SUBMENU_PADDING
                  : padding,
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize,
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "left",
                transition: TRANSITION_BG,
                minHeight,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              📚 Learn Counting
            </button>

            {/* Settings - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowSettings(true))
                    : setShowSettings(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ⚙️ Settings
              </button>
            )}

            {/* Admin - only for admins */}
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowAdminSettings(true))
                    : setShowAdminSettings(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                🎛️ Admin
              </button>
            )}

            {/* Login / Register - only for non-authenticated */}
            {!isLoading && !isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => setShowAuthModal(true))
                    : setShowAuthModal(true)
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: "none",
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BG_GOLD_MENU_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                🔑 Login / Register
              </button>
            )}

            {/* Logout - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  forMobile
                    ? handleMobileNavigation(() => handleLogout())
                    : handleLogout()
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: forMobile ? submenuPadding : SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#F44336",
                  border: "none",
                  fontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  minHeight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(244, 67, 54, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                🚪 Logout
              </button>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Mobile: Hamburger button */}
      {isMobile && (
        <>
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={mobileMenuButtonStyle}
            aria-label="Open menu"
          >
            {showMobileMenu ? "✕" : "☰"}
          </button>

          {/* Mobile overlay backdrop */}
          <div
            role="button"
            tabIndex={0}
            style={mobileOverlayStyle}
            onClick={() => setShowMobileMenu(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                setShowMobileMenu(false);
              }
            }}
            aria-label="Close menu"
          />

          {/* Mobile slide-in menu */}
          <div ref={menuRef} style={mobileMenuStyle}>
            {renderMenuItems(true)}
          </div>
        </>
      )}

      {/* Desktop: Original menu */}
      {!isMobile && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: "10px",
            right: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            border: BORDER_GOLD,
            borderRadius: "8px",
            minWidth: "180px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {renderMenuItems(false)}
        </div>
      )}

      {/* Stat change notifications - appear below menu */}
      {isAuthenticated && notifications.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "60px", // Below the menu
            right: isMobile ? "10px" : "20px",
            zIndex: 999,
          }}
        >
          {notifications.map((notif) => (
            <StatsNotification
              key={notif.id}
              icon={notif.icon}
              label={notif.label}
              value={notif.value}
              color={notif.color}
              onComplete={() => dismissNotification(notif.id)}
            />
          ))}
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={refresh}
      />
      <ChipStoreModal
        isOpen={showChipStore}
        onClose={() => setShowChipStore(false)}
      />
    </>
  );
}
