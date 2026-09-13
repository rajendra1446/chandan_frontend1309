"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Flame,
  Layers,
  ArrowLeftRight,
  Package,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Boxes,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Activity
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useSidebar } from "../lib/sidebarContext";

interface NavItem {
  name: string;
  shortName?: string;
  step?: string;
  href: string;
  icon: any;
  active: boolean;
  badge?: string;
  description?: string;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isMobileOpen, closeMobile, isCollapsed, toggleCollapse } = useSidebar();

  const userName = user?.name || "System Operator";
  const userRole = user?.role || "OPERATOR";
  const userInitial = userName.charAt(0).toUpperCase();

  // Manufacturing sequential order
  const navSections: NavSection[] = [
    {
      label: null,
      items: [
        {
          name: "Dashboard Overview",
          shortName: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          active: pathname === "/dashboard",
          description: "Live KPIs & production analytics"
        }
      ]
    },
    {
      label: "STEEL PRODUCTION WORKFLOW",
      items: [
        {
          step: "1",
          name: "Billet Casting (SMS)",
          shortName: "SMS Casting",
          href: "/dashboard/billets",
          icon: Layers,
          active: pathname === "/dashboard/billets",
          description: "Furnace heats & cut lengths"
        },
        {
          step: "2",
          name: "Lab Quality Checks",
          shortName: "Lab QA",
          href: "/dashboard/lab",
          icon: ShieldCheck,
          active: pathname === "/dashboard/lab",
          description: "Spectrometry & clearances"
        },
        {
          step: "3",
          name: "Plant Unit Transfers",
          shortName: "Dispatches",
          href: "/dashboard/dispatches",
          icon: ArrowLeftRight,
          active: pathname === "/dashboard/dispatches",
          description: "Rolling mill dispatch manifests"
        },
        {
          step: "4",
          name: "Finished Products",
          shortName: "Finished Goods",
          href: "/dashboard/finished-products",
          icon: Package,
          active: pathname === "/dashboard/finished-products",
          description: "Prime rolled steel & SKUs"
        },
        {
          step: "5",
          name: "Rejections & Scrap",
          shortName: "Rejections",
          href: "/dashboard/rejections",
          icon: AlertTriangle,
          active: pathname === "/dashboard/rejections",
          description: "Cobbles, crop cuts & remelt"
        },
        {
          step: "6",
          name: "Plant Returns",
          shortName: "Returns",
          href: "/dashboard/returns",
          icon: RotateCcw,
          active: pathname === "/dashboard/returns",
          description: "Mill-to-yard stock recovery"
        }
      ]
    },
    {
      label: "AUDIT & RECONCILIATION",
      items: [
        {
          name: "360° Heat Traceability",
          shortName: "Traceability",
          href: "/dashboard/traceability",
          icon: Flame,
          badge: "E2E",
          active: pathname === "/dashboard/traceability",
          description: "Complete melt-to-mill genealogy"
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "bg-gradient-to-b from-[#080c16] via-[#0b1120] to-[#070a12] text-slate-300 flex flex-col justify-between border-slate-800/80 select-none shrink-0 transition-all duration-300 ease-in-out shadow-2xl",
          // Mobile (< lg): When drawer is open, fixed slide-over. When closed, hidden (takes ZERO space in document flow)
          isMobileOpen
            ? "fixed inset-y-0 left-0 z-50 w-[80vw] max-w-xs sm:w-72 translate-x-0 flex h-full"
            : "hidden lg:flex lg:static h-full",
          // Desktop (lg): When collapsed/hidden, w-0 opacity-0 overflow-hidden so main section expands to 100% whole page
          isCollapsed
            ? "lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-none pointer-events-none"
            : "lg:w-68 lg:opacity-100 lg:border-r"
        )}
      >
        {/* Top ambient radial glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col h-full overflow-hidden relative z-10 w-full min-w-[16rem]">
          {/* Brand Header */}
          <div className="px-4 py-4 sm:py-5 flex items-center justify-between border-b border-slate-800/80 shrink-0 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              {/* Molten Steel Glowing Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 group">
                <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center transition-colors group-hover:bg-[#0c1322]">
                  <Boxes className="w-5 h-5 text-orange-500" />
                </div>
              </div>

              {/* Brand Typography */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black tracking-wider text-white uppercase font-sans truncate">
                    CHANDAN STEEL
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-extrabold tracking-widest text-orange-400/90 uppercase font-mono">
                    MES 4.0
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase font-sans">
                    TRACEABILITY
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Collapse / Hide Button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700/60"
              title="Hide Navigation Sidebar (Full Page View)"
              aria-label="Hide Navigation Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Pulse Live Indicator (Shown when expanded) */}
          {!isCollapsed && (
            <div className="px-4 pt-3 pb-1 shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-slate-300">SMS LIVE</span>
                </div>
                <span className="text-slate-500 font-semibold uppercase text-[9px]">ONLINE</span>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-none">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {/* Section Header */}
                {section.label && !isCollapsed && (
                  <div className="px-3 py-1 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase font-mono flex items-center gap-2">
                    <span>{section.label}</span>
                    <div className="flex-1 h-[1px] bg-slate-800/60"></div>
                  </div>
                )}
                {section.label && isCollapsed && (
                  <div className="h-[1px] bg-slate-800/60 my-2 mx-2"></div>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      title={isCollapsed ? `${item.name} ${item.step ? `(Step ${item.step})` : ""}` : undefined}
                      className={clsx(
                        "relative flex items-center rounded-xl text-xs font-semibold font-sans transition-all group",
                        isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5",
                        item.active
                          ? "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      )}
                    >
                      {/* Left Active Accent Indicator */}
                      {item.active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full shadow-sm" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        {/* Step Number or Icon */}
                        {item.step ? (
                          <div
                            className={clsx(
                              "w-6 h-6 rounded-lg text-[10px] font-bold font-mono flex items-center justify-center shrink-0 transition-all",
                              item.active
                                ? "bg-black/25 text-white ring-1 ring-white/30"
                                : "bg-slate-800/90 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-100 border border-slate-700/60"
                            )}
                          >
                            {item.step}
                          </div>
                        ) : (
                          <div
                            className={clsx(
                              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all",
                              item.active ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                        )}

                        {/* Text Label (Expanded) */}
                        {!isCollapsed && (
                          <div className="min-w-0">
                            <span className="tracking-tight block truncate font-medium">{item.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Badge (Expanded) */}
                      {!isCollapsed && item.badge && (
                        <span
                          className={clsx(
                            "text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono shrink-0",
                            item.active
                              ? "bg-black/30 text-white border border-white/20"
                              : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom User Profile & Sign Out Card */}
          <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#070a12]">
            {!isCollapsed ? (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* User Initials Avatar */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 p-[1.5px] shrink-0 shadow-xs">
                      <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center text-xs font-black text-orange-400 font-mono">
                        {userInitial}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 block truncate font-sans">
                        {userName}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-orange-400/90 uppercase tracking-wider block">
                        {userRole}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>SECURE MES</span>
                  </span>
                  <span>v2.4 PRO</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title={`Signed in as ${userName} (${userRole}) - Click to Sign Out`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <span className="text-[9px] font-mono font-bold text-slate-400">PRO</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
