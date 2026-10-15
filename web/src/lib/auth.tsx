"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api, tokenStore, UNAUTHORIZED_EVENT } from "./api";
import { clearCache } from "./use-async";
import type { AuthPayload, Role, User } from "./types";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  status: Status;
  user: User | null;
  token: string | null;
  signIn: (payload: AuthPayload) => void;
  adoptToken: (token: string) => Promise<User>;
  signOut: () => void;
  setUser: (user: User) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const SERVER_TOKEN = "ssr";
const listeners = new Set<() => void>();

function subscribeToken(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === "agroyachay.token") listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore<string | null>(subscribeToken, tokenStore.get, () => SERVER_TOKEN);
  const hydrating = snapshot === SERVER_TOKEN;
  const token = hydrating ? null : snapshot;
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [failedToken, setFailedToken] = useState<string | null>(null);

  const signOut = useCallback(() => {
    clearCache();
    tokenStore.clear();
    setSession(null);
    emit();
  }, []);

  useEffect(() => {
    if (!token || session?.token === token || failedToken === token) return;
    let cancelled = false;
    api
      .me()
      .then((user) => {
        if (!cancelled) setSession({ token, user });
      })
      .catch(() => {
        if (cancelled) return;
        setFailedToken(token);
        tokenStore.clear();
        emit();
      });
    return () => {
      cancelled = true;
    };
  }, [token, session, failedToken]);

  useEffect(() => {
    const handler = () => signOut();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [signOut]);

  const signIn = useCallback((payload: AuthPayload) => {
    clearCache();
    tokenStore.set(payload.token);
    setSession({ token: payload.token, user: payload.user });
    emit();
  }, []);

  const adoptToken = useCallback(async (next: string) => {
    clearCache();
    tokenStore.set(next);
    try {
      const user = await api.me();
      setSession({ token: next, user });
      emit();
      return user;
    } catch (error) {
      tokenStore.clear();
      emit();
      throw error;
    }
  }, []);

  const setUser = useCallback((user: User) => {
    setSession((current) => (current ? { ...current, user } : current));
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = token && session?.token === token ? session.user : null;
    const status: Status = hydrating ? "loading" : !token ? "anonymous" : user ? "authenticated" : "loading";
    return {
      status,
      user,
      token,
      signIn,
      adoptToken,
      signOut,
      setUser,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    };
  }, [hydrating, token, session, signIn, adoptToken, signOut, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}

export function isAdmin(user: User | null): boolean {
  return !!user && (user.role === "admin" || user.role === "superadmin");
}
