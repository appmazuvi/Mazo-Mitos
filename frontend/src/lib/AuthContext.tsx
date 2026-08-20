import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "./api";
import { disconnectSocket } from "./socket";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("cartaverso_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cartaverso_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  function persist(userData: User, tok: string) {
    setToken(tok);
    setTokenState(tok);
    setUser(userData);
    localStorage.setItem("cartaverso_user", JSON.stringify(userData));
  }

  async function login(emailOrUsername: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/api/auth/login", { emailOrUsername, password });
    persist(res.user, res.token);
  }

  async function register(email: string, username: string, password: string, displayName?: string) {
    const res = await api.post<{ token: string; user: User }>("/api/auth/register", {
      email,
      username,
      password,
      displayName,
    });
    persist(res.user, res.token);
  }

  function logout() {
    setToken(null);
    setTokenState(null);
    setUser(null);
    localStorage.removeItem("cartaverso_user");
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
