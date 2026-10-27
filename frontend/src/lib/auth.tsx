import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearToken, setToken } from "./api";
import type { UserView } from "./types";

const USER_KEY = "reday-user";

interface AuthContextValue {
  user: UserView | null;
  login: (token: string, user: UserView) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): UserView | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserView;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserView | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (token, loggedInUser) => {
        setToken(token);
        localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      },
      logout: () => {
        clearToken();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
