"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  ArrowLeftRight,
  Package,
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Factory
} from "lucide-react";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../lib/api";

export default function DashboardPage() {
  // 1. Fetch Executive KPI Metrics
  const { data: metricsData, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => api.get("/traceability/summary")
  });

  // 2. Fetch Recent Heats
  const { data: heatsData, isLoading: isHeatsLoading } = useQuery({
    queryKey: ["recent-heats"],
    queryFn: () => api.get("/billets/heats?limit=10")
  });

  const metrics = metricsData?.data;
  const heats = heatsData?.data || [];

  // Table columns for Recent Heats
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "heat_number",
      header: "HEAT NUMBER",
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>{row.original.heat_number}</span>
        </div>
      )
    },
    {
      accessorKey: "grade",
      header: "GRADE",
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
          {row.original.grade}
        </span>
      )
    },
    {
      accessorKey: "section",
      header: "SECTION",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-slate-600">
          {row.original.section}
        </span>
      )
    },
    {
      accessorKey: "total_pieces",
      header: "TOTAL PIECES",
      cell: ({ row }) => (
        <span className="font-bold text-slate-800">
          {row.original.total_pieces} pcs
        </span>
      )
    },
    {
      accessorKey: "total_weight_mt",
      header: "CAST WEIGHT",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.original.total_weight_mt} MT
        </span>
      )
    },
    {
      accessorKey: "available_weight_mt",
      header: "YARD STOCK",
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600">
          {row.original.available_weight_mt} MT
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const s = row.original.status || "CAST";
        const isApproved = s.includes("APPROVED");
        const isDispatch = s.includes("DISPATCH");
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
              isApproved
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isDispatch
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {s}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/traceability?heat=${row.original.heat_number}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
        >
          <span>Trace E2E</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )
    }
  ];

  return (
    <>
      <Topbar
        pageTitle="MES Operations Dashboard"
        mobileTitle="MES Overview"
        pageSubtitle="Real-time casting, spectrometry testing, mill transfers & material balance ledger"
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 flex-1 font-sans">
        {/* KPI Stat Cards - 2x2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          <StatCard
            title="TOTAL CAST HEATS"
            value={metrics?.heats?.total_heats || (isMetricsLoading ? "..." : "0")}
            subtitle={`${metrics?.heats?.total_cast_pieces || 0} Total Cut Billets`}
            icon={Layers}
            variant="orange"
          />
          <StatCard
            title="TOTAL CAST PRODUCTION"
            value={`${metrics?.heats?.total_cast_weight_mt || 0} MT`}
            subtitle={`${metrics?.heats?.total_available_weight_mt || 0} MT in Yard Stock`}
            icon={Flame}
            variant="amber"
          />
          <StatCard
            title="MILL UNIT TRANSFERS"
            value={metrics?.dispatches?.total_dispatches || 0}
            subtitle={`${metrics?.dispatches?.total_dispatched_weight_mt || 0} MT sent to mills`}
            icon={ArrowLeftRight}
            variant="slate"
          />
          <StatCard
            title="AVERAGE ROLLING YIELD"
            value={`${metrics?.finished_production?.average_yield_pct != null ? metrics.finished_production.average_yield_pct : 0}%`}
            subtitle={`${metrics?.finished_production?.total_finished_weight_mt || 0} MT prime finished`}
            icon={Package}
            variant="emerald"
          />
        </div>

        {/* Quick Actions Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 border border-slate-700/60 font-sans">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold">
              <Factory className="w-3.5 h-3.5" />
              <span>Chandan Steel Core MES Workflow</span>
            </div>
            <h3 className="text-base sm:text-xl font-black tracking-tight font-sans">
              Primary Billet Casting & Multi-Length Transfers
            </h3>
            <p className="text-xs text-slate-300 max-w-xl font-sans leading-relaxed">
              Cast heats with multi-length pieces (7.4m, 5.0m, 5.4m), verify spectrometer lab chemistry, transfer to rolling plants, and audit complete material balances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/dashboard/billets"
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cast New Heat</span>
            </Link>
            <Link
              href="/dashboard/dispatches"
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer to Mill</span>
            </Link>
          </div>
        </div>

        {/* Recent Cast Heats Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Cast Heats & Yard Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Heats registered from SMS/CCM with available piece counts and MT
              </p>
            </div>
            <Link
              href="/dashboard/billets"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All Billets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={heats}
            searchPlaceholder="Search heat, grade, or section..."
            isLoading={isHeatsLoading}
          />
        </div>
      </main>
    </>
  );
}
