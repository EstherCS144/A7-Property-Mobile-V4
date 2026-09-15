"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { readStoredJson, removeStoredValue, STORAGE_KEYS, writeStoredJson } from "@/lib/local-storage";

export type AccountType = "seeker" | "lister";
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  isAgent: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  avatarUrl?: string;
  agencyName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (email: string, accountType: AccountType) => AuthUser;
  signUp: (email: string, fullName: string, accountType: AccountType) => AuthUser;
  signOut: () => void;
  upgradeToLister: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

const AUTH_STORAGE_KEY = STORAGE_KEYS.authUser;

const AuthContext = createContext<AuthContextValue | null>(null);

function generateId() {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createUser(email: string, fullName: string, accountType: AccountType): AuthUser {
  return {
    id: generateId(),
    email,
    fullName,
    accountType,
    isAgent: false,
    phoneVerified: false,
    idVerified: false,
  };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const stored = readStoredJson<AuthUser | null>(AUTH_STORAGE_KEY, null);
    queueMicrotask(() => {
      setUser(stored);
      setStatus(stored ? "authenticated" : "unauthenticated");
    });

    function syncAuth(event: StorageEvent) {
      if (event.key !== AUTH_STORAGE_KEY) return;
      const nextUser = event.newValue ? readStoredJson<AuthUser | null>(AUTH_STORAGE_KEY, null) : null;
      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "unauthenticated");
    }

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const persist = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      writeStoredJson(AUTH_STORAGE_KEY, nextUser);
    } else {
      removeStoredValue(AUTH_STORAGE_KEY);
    }
    setStatus(nextUser ? "authenticated" : "unauthenticated");
  }, []);

  const signIn = useCallback((email: string, accountType: AccountType): AuthUser => {
    const existing = user?.email === email ? user : null;
    const nextUser = existing
      ? { ...existing, accountType }
      : createUser(email, email.split("@")[0] || "User", accountType);
    persist(nextUser);
    return nextUser;
  }, [user, persist]);

  const signUp = useCallback((email: string, fullName: string, accountType: AccountType): AuthUser => {
    const nextUser = createUser(email, fullName, accountType);
    persist(nextUser);
    return nextUser;
  }, [persist]);

  const signOut = useCallback(() => {
    persist(null);
  }, [persist]);

  const upgradeToLister = useCallback(() => {
    if (!user) return;
    persist({ ...user, accountType: "lister" });
  }, [persist, user]);

  const updateProfile = useCallback((patch: Partial<AuthUser>) => {
    if (!user) return;
    persist({ ...user, ...patch });
  }, [persist, user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    signIn,
    signUp,
    signOut,
    upgradeToLister,
    updateProfile,
  }), [user, status, signIn, signUp, signOut, upgradeToLister, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
