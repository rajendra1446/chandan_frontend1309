"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PLANT_MANAGER" | "LAB_CHEMIST" | "STORE_MANAGER" | "OPERATOR";
  department?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    try {
      const storedToken = localStorage.getItem("chandan_token");
      const storedUser = localStorage.getItem("chandan_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
      localStorage.removeItem("chandan_token");
      localStorage.removeItem("chandan_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        data: { user: User; token: string };
      }>("/auth/login", { email, password });

      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("chandan_token", res.data.token);
        localStorage.setItem("chandan_user", JSON.stringify(res.data.user));
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Login failed." };
    } catch (error: any) {
      return { success: false, message: error.message || "Invalid credentials." };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) => {
    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        data: { user: User; token: string };
      }>("/auth/register", userData);

      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("chandan_token", res.data.token);
        localStorage.setItem("chandan_user", JSON.stringify(res.data.user));
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Registration failed." };
    } catch (error: any) {
      return { success: false, message: error.message || "Registration failed." };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("chandan_token");
    localStorage.removeItem("chandan_user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
