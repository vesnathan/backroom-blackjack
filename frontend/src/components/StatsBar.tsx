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

const BORDER_GOLD = "2px solid #FFD700";
const BG_GOLD_MENU_HOVER = "rgba(255, 215, 0, 0.2)";
const MENU_ITEM_BORDER = "1px solid #444";
const TRANSITION_BG = "background-color 0.2s";
const SUBMENU_PADDING = "12px 16px 12px 32px";
const JUSTIFY_SPACE_BETWEEN = "space-between";

export default function StatsBar() {
  const { currentStreak, playerChips, chipsLoading, currentScore, scoreMultiplier } =
    useGameState();

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
  const { isAuthenticated, isLoading, isAdmin, user, refresh } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-away to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const handleLogout = async () => {
    await signOut();
    await refresh();
  };

  return (
    <>
      {/* Top left stats menu */}
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
        {/* Chips - auth only */}
        {isAuthenticated && (
          <div
            style={{
              padding: "12px 16px",
              color: "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
            }}
          >
            <span>💰 Chips</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {chipsLoading ? "..." : `$${playerChips.toLocaleString()}`}
              <button
                type="button"
                onClick={() => setShowChipStore(true)}
                title="Buy more chips"
                style={{
                  backgroundColor: "transparent",
                  color: "#4CAF50",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "0 4px",
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
              padding: "12px 16px",
              color: "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
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
              padding: "12px 16px",
              color: scoreMultiplier > 1.0 ? "#4CAF50" : "#FFF",
              borderBottom: MENU_ITEM_BORDER,
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: JUSTIFY_SPACE_BETWEEN,
              alignItems: "center",
            }}
          >
            <span>✨ Multiplier</span>
            <span>{scoreMultiplier.toFixed(1)}x</span>
          </div>
        )}

        {/* More Menu Expander - only for authenticated users */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "transparent",
              color: "#FFF",
              border: "none",
              borderBottom: showMoreMenu ? MENU_ITEM_BORDER : "none",
              fontSize: "14px",
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

        {/* Expanded Menu Items - always show for non-auth, expandable for auth */}
        {(showMoreMenu || !isAuthenticated) && (
          <>
            {/* Show Count - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowCountPeek(true)}
                title={
                  scoreMultiplier > 1.0
                    ? "Peek at count (costs 10 chips, resets multiplier to 1.0x)"
                    : "Peek at count (costs 10 chips)"
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span>👁️ Show Count</span>
                  <span
                    style={{
                      fontSize: "11px",
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
                onClick={() => setShowStrategyCard(true)}
                disabled={strategyCardUsedThisHand}
                title={
                  strategyCardUsedThisHand
                    ? "Strategy card already used this hand (cooldown active)"
                    : "View basic strategy chart (costs 10 chips)"
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: strategyCardUsedThisHand ? "#666" : "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: strategyCardUsedThisHand ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
                  opacity: strategyCardUsedThisHand ? 0.5 : 1,
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
                      fontSize: "11px",
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
              onClick={() => setShowLeaderboard(true)}
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated ? SUBMENU_PADDING : "12px 16px",
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize: "14px",
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
              🏆 Leaderboard
            </button>

            {/* Global Chat - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowChat(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                💬 Chat
              </button>
            )}

            {/* Profile - only for authenticated */}
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={() => router.push(`/profile?userId=${user.userId}`)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                👤 My Profile
              </button>
            )}

            {/* Supporters */}
            <button
              type="button"
              onClick={() => router.push("/supporters")}
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated ? SUBMENU_PADDING : "12px 16px",
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize: "14px",
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
              💎 Supporters
            </button>

            {/* Charts - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowHeatMap(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                📈 Charts
              </button>
            )}

            {/* Stats - auth only */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowSessionStats(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                📊 Stats
              </button>
            )}

            {/* Advanced Analytics - Gold+ (auth only) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  if (hasFeature("advancedAnalytics")) {
                    setShowAdvancedAnalytics(true);
                  } else {
                    router.push("/subscribe");
                  }
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: hasFeature("advancedAnalytics") ? "#FFD700" : "#888",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                {hasFeature("advancedAnalytics")
                  ? "📈 Analytics"
                  : "🔒 Analytics (Gold+)"}
              </button>
            )}

            {/* Learn Counting - always available */}
            <button
              type="button"
              onClick={() => router.push("/learn")}
              style={{
                display: "block",
                width: "100%",
                padding: isAuthenticated ? SUBMENU_PADDING : "12px 16px",
                backgroundColor: "transparent",
                color: "#FFF",
                border: "none",
                borderBottom: MENU_ITEM_BORDER,
                fontSize: "14px",
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
              📚 Learn Counting
            </button>

            {/* Settings - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                ⚙️ Settings
              </button>
            )}

            {/* Admin - only for admins */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminSettings(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: MENU_ITEM_BORDER,
                  fontSize: "14px",
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
                🎛️ Admin
              </button>
            )}

            {/* Login / Register - only for non-authenticated */}
            {!isLoading && !isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  color: "#FFF",
                  border: "none",
                  borderBottom: "none",
                  fontSize: "14px",
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
                🔑 Login / Register
              </button>
            )}

            {/* Logout - only for authenticated */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => handleLogout()}
                style={{
                  display: "block",
                  width: "100%",
                  padding: SUBMENU_PADDING,
                  backgroundColor: "transparent",
                  color: "#F44336",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: TRANSITION_BG,
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
      </div>

      {/* Stat change notifications - appear below menu */}
      {isAuthenticated && notifications.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "60px", // Below the menu
            right: "20px",
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
