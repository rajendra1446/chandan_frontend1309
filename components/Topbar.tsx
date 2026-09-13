"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  User as UserIcon,
  Menu,
  ChevronDown,
  ShieldCheck,
  Mail,
  Building,
  LogOut,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useSidebar } from "../lib/sidebarContext";

interface TopbarProps {
  pageTitle: string;
  mobileTitle?: string;
  pageSubtitle?: string;
  subtitle?: string;
}

export default function Topbar({
  pageTitle,
  mobileTitle,
  pageSubtitle,
  subtitle
}: TopbarProps) {
  const { user, logout } = useAuth();
  const { toggleMobile, toggleCollapse, isCollapsed } = useSidebar();
  const displaySubtitle = pageSubtitle || subtitle;

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = user?.name || "System Administrator";
  const userEmail = user?.email || "admin@chandansteel.com";
  const userRole = user?.role || "ADMIN";
  const userDepartment = user?.department || "Central Management & SMS";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Sticky Fixed Header */}
      <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 font-sans shadow-xs transition-all w-full">
        {/* Left: Mobile Toggle & Professional Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Sidebar Toggle Button (Desktop & Mobile) */}
          <button
            onClick={handleToggleSidebar}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Show Navigation Sidebar" : "Hide Navigation Sidebar (Full Page Mode)"}
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Plant Brand Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200/80 shrink-0 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>CHANDAN MES</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate font-sans">
              <span className="sm:hidden">{mobileTitle || pageTitle}</span>
              <span className="hidden sm:inline">{pageTitle}</span>
            </h1>
            {displaySubtitle && (
              <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5 font-sans">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Notifications & Interactive Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              title="System Notifications"
              aria-label="System Notifications"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white"></span>
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-88 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-bold text-slate-900">MES Notifications</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Sync
                  </span>
                </div>
                <div className="py-3 space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Billet Stock & Yard Audit</span>
                      <span className="text-[10px] text-slate-400 font-normal">Just now</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      All physical balances reconciled with mill transfer manifests and rolling recovery logs.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1">
                    <div className="flex items-center justify-between font-bold text-orange-900">
                      <span>Lab Compliance Verified</span>
                      <span className="text-[10px] text-orange-500 font-normal">Active</span>
                    </div>
                    <p className="text-orange-700 leading-relaxed">
                      Spectrometer chemical composition validation active for all ASTM A276 grades.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive User Avatar & Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 py-1 pr-1.5 rounded-2xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              aria-label="User Profile Menu"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xs transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-orange-600 font-black text-sm sm:text-base">
                  {userInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Active"></span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">
                  {userName}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
                  {userRole}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                {/* User Summary Header */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white mb-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-inner">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold truncate leading-snug">
                        {userName}
                      </div>
                      <div className="text-xs text-slate-300 truncate mt-0.5">
                        {userEmail}
                      </div>
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-wide uppercase text-orange-300 border border-white/10">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{userRole}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions List */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-4 h-4 text-orange-500" />
                    <div className="flex-1">
                      <div>View Profile Details</div>
                      <div className="text-[10px] font-normal text-slate-400">Identity, department & security roles</div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out from MES</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* View Full Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header Cover */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close Profile"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-1 shadow-lg">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-orange-400 font-black text-2xl">
                    {userInitial}
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Active Authenticated Session</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{userName}</h3>
                  <p className="text-xs text-slate-300">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Modal Body: Profile Information Details */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Designation / Role */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    <span>Designation & Role</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {userRole}
                  </div>
                </div>

                {/* Department */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Building className="w-4 h-4 text-orange-500" />
                    <span>Assigned Department</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {userDepartment}
                  </div>
                </div>

                {/* User Email */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span>Official Email Address</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {userEmail}
                  </div>
                </div>
              </div>

              {/* Plant Authorization Privileges */}
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-orange-900">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Plant Authorization & Modules</span>
                </div>
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                  Authorized for Continuous Billet Casting (SMS), Spectrometer Chemical Testing (Lab), Multi-Mill Plant Transfers, Rolling Production Batches, Rejection Ledgers & 360° Material Balance Audits.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-slate-900/10"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

