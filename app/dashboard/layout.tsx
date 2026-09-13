"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { SidebarProvider } from "../../lib/sidebarContext";
import { useAuth } from "../../lib/authContext";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090e1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-sans">
            Loading Chandan MES...
          </span>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans w-full">
        {/* Responsive Sidebar (Static on desktop, drawer on mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full transition-all duration-300">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
