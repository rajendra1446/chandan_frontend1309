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
  X
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useSidebar } from "../lib/sidebarContext";

interface NavItem {
  name: string;
  step?: string;
  href: string;
  icon: any;
  active: boolean;
  badge?: string;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isMobileOpen, closeMobile } = useSidebar();

  // Manufacturing sequential order
  const navSections: NavSection[] = [
    {
      label: null,
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          active: pathname === "/dashboard"
        }
      ]
    },
    {
      label: "STEEL PRODUCTION WORKFLOW",
      items: [
        {
          step: "1",
          name: "Billet Casting (SMS)",
          href: "/dashboard/billets",
          icon: Layers,
          active: pathname === "/dashboard/billets"
        },
        {
          step: "2",
          name: "Lab Quality Checks",
          href: "/dashboard/lab",
          icon: ShieldCheck,
          active: pathname === "/dashboard/lab"
        },
        {
          step: "3",
          name: "Unit Transfers",
          href: "/dashboard/dispatches",
          icon: ArrowLeftRight,
          active: pathname === "/dashboard/dispatches"
        },
        {
          step: "4",
          name: "Finished Products",
          href: "/dashboard/finished-products",
          icon: Package,
          active: pathname === "/dashboard/finished-products"
        },
        {
          step: "5",
          name: "Rejections & Scrap",
          href: "/dashboard/rejections",
          icon: AlertTriangle,
          active: pathname === "/dashboard/rejections"
        },
        {
          step: "6",
          name: "Plant Returns",
          href: "/dashboard/returns",
          icon: RotateCcw,
          active: pathname === "/dashboard/returns"
        }
      ]
    },
    {
      label: "AUDIT & RECONCILIATION",
      items: [
        {
          name: "360° Billet Trace",
          href: "/dashboard/traceability",
          icon: Flame,
          badge: "E2E",
          active: pathname === "/dashboard/traceability"
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "w-64 bg-[#090e1a] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 select-none shrink-0 transition-transform duration-300 ease-in-out z-50",
          "fixed inset-y-0 left-0 lg:static lg:translate-x-0 h-full",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Logo & Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b border-slate-800/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1.5px] flex items-center justify-center shadow-md shadow-orange-500/20">
                <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wide text-white leading-tight font-sans">
                  CHANDAN STEEL
                </h1>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-sans">
                  MES & TRACEABILITY
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-none">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.label && (
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={clsx(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all group",
                        item.active
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.step ? (
                          <span
                            className={clsx(
                              "w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-colors",
                              item.active
                                ? "bg-black/20 text-white"
                                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                            )}
                          >
                            {item.step}
                          </span>
                        ) : (
                          <Icon
                            className={clsx(
                              "w-4 h-4 transition-colors",
                              item.active
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-200"
                            )}
                          />
                        )}
                        <span className="tracking-tight">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={clsx(
                            "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-sans",
                            item.active
                              ? "bg-black/20 text-white"
                              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
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

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#090e1a]">
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs font-semibold font-sans text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-400">
                v2.0 PRO
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
