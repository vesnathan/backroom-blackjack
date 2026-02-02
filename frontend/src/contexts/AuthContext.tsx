"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

export interface User {
  userId: string;
  username: string;
  email?: string;
  groups?: string[];
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: User;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthStatus | undefined>(undefined);

// Helper to decode JWT payload without verification (for extracting groups)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      // First check if user is signed in (doesn't touch Identity Pool)
      const cognitoUser = await getCurrentUser().catch(() => null);

      if (!cognitoUser) {
        setIsAuthenticated(false);
        setIsLoading(false);
        setUser(undefined);
        setIsAdmin(false);
        return;
      }

      // Get user tokens to extract groups (uses User Pool tokens only, no Identity Pool)
      let groups: string[] = [];
      try {
        const session = await fetchAuthSession();
        if (session.tokens?.accessToken) {
          groups =
            (session.tokens.accessToken.payload[
              "cognito:groups"
            ] as string[]) || [];
        }
      } catch {
        // Fallback: extract groups from localStorage token if session fetch fails
        const keys = Object.keys(localStorage);
        const accessTokenKey = keys.find(
          (k) =>
            k.includes("CognitoIdentityServiceProvider") &&
            k.endsWith(".accessToken"),
        );
        if (accessTokenKey) {
          const accessToken = localStorage.getItem(accessTokenKey);
          if (accessToken) {
            const payload = decodeJwtPayload(accessToken);
            if (payload) {
              groups = (payload["cognito:groups"] as string[]) || [];
            }
          }
        }
      }

      const isAdminUser = groups.includes("admin");

      setIsAuthenticated(true);
      setUser({
        userId: cognitoUser.userId,
        username: cognitoUser.username,
        groups,
      });
      setIsAdmin(isAdminUser);
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[AuthContext] checkAuthStatus error:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      setUser(undefined);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Memoize the context value to prevent unnecessary re-renders
  const authStatus = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      isAdmin,
      refresh: checkAuthStatus,
    }),
    [isAuthenticated, isLoading, user, isAdmin, checkAuthStatus],
  );

  return (
    <AuthContext.Provider value={authStatus}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthStatus {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
